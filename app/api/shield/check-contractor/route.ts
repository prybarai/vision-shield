import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkContractorLicense } from '@/lib/careeronestop';

const schema = z.object({
  contractor_name: z.string().optional(),
  contractor_phone: z.string().optional(),
  contractor_business_name: z.string().optional(),
  contractor_website: z.string().optional(),
  contractor_license_number: z.string().optional(),
  state: z.string().min(2).max(2),
  questionnaire_answers: z.record(z.string(), z.string()).optional(),
  session_id: z.string().optional(),
  preview_only: z.boolean().optional(),
});

type RiskLevel = 'low' | 'medium' | 'high';

const QUESTION_WEIGHTS: Record<string, number> = {
  q1_unsolicited: 15,
  q2_upfront: 20,
  q3_cash_only: 25,
  q4_no_contract: 25,
  q5_low_bid: 10,
  q6_no_insurance: 20,
  q7_pressure: 15,
  q8_no_permits: 15,
};

const FLAG_COPY: Record<string, { flag: string; explanation: string; severity: 'high' | 'medium' | 'low' }> = {
  q1_unsolicited: { flag: 'Unsolicited approach', explanation: 'Door-to-door or surprise solicitations can be a warning sign, especially after storms or neighborhood work.', severity: 'medium' },
  q2_upfront: { flag: 'Large upfront payment', explanation: 'Big deposits increase your risk if work is delayed, abandoned, or disputed.', severity: 'high' },
  q3_cash_only: { flag: 'Cash-only request', explanation: 'Cash-only payment makes it harder to document the transaction and recover funds.', severity: 'high' },
  q4_no_contract: { flag: 'No written contract', explanation: 'A written contract helps lock in scope, timing, materials, and payment expectations.', severity: 'high' },
  q5_low_bid: { flag: 'Quote is far below others', explanation: 'A quote that is unusually low can signal corner-cutting, change-order surprises, or bait pricing.', severity: 'medium' },
  q6_no_insurance: { flag: 'No proof of insurance', explanation: 'Without proof of liability and workers comp coverage, you could be exposed if something goes wrong.', severity: 'high' },
  q7_pressure: { flag: 'Pressure tactics', explanation: 'Urgent pressure to sign today or pay now is a common consumer-protection red flag.', severity: 'medium' },
  q8_no_permits: { flag: 'No permits planned', explanation: 'Skipping permits can create safety, resale, and liability problems later.', severity: 'medium' },
};

function calculateRiskScore(answers: Record<string, string>, licenseFound: boolean): { score: number; level: RiskLevel } {
  let score = 0;

  if (!licenseFound) score += 30;

  Object.entries(QUESTION_WEIGHTS).forEach(([key, weight]) => {
    if (answers[key] === 'yes') score += weight;
    if (answers[key] === 'not_sure') score += Math.floor(weight * 0.4);
  });

  score = Math.min(score, 100);
  const level: RiskLevel = score <= 30 ? 'low' : score <= 60 ? 'medium' : 'high';
  return { score, level };
}

function buildNextSteps(answers: Record<string, string>, licenseFound: boolean): string[] {
  const steps: string[] = [];

  if (!licenseFound) {
    steps.push('Verify the contractor directly with your state licensing board before paying or signing anything.');
  }
  if (answers.q4_no_contract === 'yes') {
    steps.push('Ask for a written contract that clearly lists scope, materials, timeline, and payment schedule.');
  }
  if (answers.q2_upfront === 'yes' || answers.q3_cash_only === 'yes') {
    steps.push('Do not pay a large deposit or cash-only payment without a documented schedule and receipt trail.');
  }
  if (answers.q6_no_insurance === 'yes' || answers.q8_no_permits === 'yes') {
    steps.push('Request proof of insurance and ask who is pulling permits before work starts.');
  }
  if (answers.q7_pressure === 'yes' || answers.q1_unsolicited === 'yes') {
    steps.push('Slow the process down and compare at least one or two other licensed contractors before deciding.');
  }
  if (answers.q5_low_bid === 'yes') {
    steps.push('Ask why the quote is much lower than others and get any exclusions or allowances in writing.');
  }

  return Array.from(new Set(steps)).slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const licenseResult = await checkContractorLicense({
      name: params.contractor_name,
      businessName: params.contractor_business_name,
      licenseNumber: params.contractor_license_number,
      state: params.state,
    });

    if (params.preview_only) {
      return NextResponse.json({
        license: licenseResult,
        questionnaire_ready: true,
      });
    }

    const answers = params.questionnaire_answers || {};
    const licenseFound = licenseResult.status === 'active';
    const score = calculateRiskScore(answers, licenseFound);
    const triggeredFlags = Object.entries(answers)
      .filter(([, value]) => value === 'yes')
      .map(([key]) => FLAG_COPY[key])
      .filter(Boolean);

    const nextSteps = buildNextSteps(answers, licenseFound);

    let insertedScan: Record<string, unknown> | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('contractor_scans')
        .insert({
          session_id: params.session_id,
          contractor_name: params.contractor_name,
          contractor_phone: params.contractor_phone,
          contractor_business_name: params.contractor_business_name,
          contractor_website: params.contractor_website,
          contractor_license_number: params.contractor_license_number,
          state: params.state,
          license_status: licenseResult.status,
          license_data: licenseResult,
          risk_score: score.score,
          risk_level: score.level,
          risk_flags: triggeredFlags,
          questionnaire_answers: answers,
          next_steps: nextSteps,
        })
        .select()
        .single();

      insertedScan = data;
    } catch (dbError) {
      console.warn('contractor_scans insert failed', dbError);
    }

    return NextResponse.json({
      scan: insertedScan,
      license: licenseResult,
      risk: {
        risk_score: score.score,
        risk_level: score.level,
        risk_flags: triggeredFlags,
        next_steps: nextSteps,
      },
    });
  } catch (error) {
    console.error('check contractor error:', error);
    return NextResponse.json({ error: 'Failed to check contractor' }, { status: 500 });
  }
}
