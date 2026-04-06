import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildDisputePrompt } from '@/lib/prompts';

const schema = z.object({
  situation_description: z.string().min(20),
  what_happened: z.string().min(20),
  contractor_name: z.string().optional(),
  contractor_business: z.string().optional(),
  contractor_phone: z.string().optional(),
  amount_paid: z.number().min(0),
  state: z.string().min(2).max(2),
  acknowledged_not_legal_advice: z.boolean(),
  session_id: z.string().optional(),
});

interface DisputeResult {
  demand_letter: string;
  ag_complaint: string;
  bbb_complaint: string;
  ftc_guidance: string;
  documentation_checklist: string[];
  small_claims_note: string;
}

function normalizeResult(result: DisputeResult): DisputeResult {
  return {
    demand_letter: result.demand_letter || '',
    ag_complaint: result.ag_complaint || '',
    bbb_complaint: result.bbb_complaint || '',
    ftc_guidance: result.ftc_guidance || '',
    documentation_checklist: Array.isArray(result.documentation_checklist) ? result.documentation_checklist : [],
    small_claims_note: result.small_claims_note || '',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    if (!params.acknowledged_not_legal_advice) {
      return NextResponse.json({ error: 'Must acknowledge this is not legal advice.' }, { status: 400 });
    }

    const contractorInfo: Record<string, string> = {};
    if (params.contractor_name) contractorInfo.name = params.contractor_name;
    if (params.contractor_business) contractorInfo.business = params.contractor_business;
    if (params.contractor_phone) contractorInfo.phone = params.contractor_phone;

    const result = normalizeResult(await parseClaudeJSON<DisputeResult>(
      'You are a consumer rights expert helping homeowners prepare contractor dispute materials. Be factual, organized, professional, and calm. Output ONLY valid JSON.',
      buildDisputePrompt({
        situation: params.situation_description,
        contractorInfo,
        amountPaid: params.amount_paid,
        state: params.state,
        whatHappened: params.what_happened,
      }),
    ));

    let insertedDispute: Record<string, unknown> | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('dispute_letters')
        .insert({
          session_id: params.session_id,
          situation_description: params.situation_description,
          contractor_info: contractorInfo,
          amount_paid: params.amount_paid,
          state: params.state,
          acknowledged_not_legal_advice: params.acknowledged_not_legal_advice,
          letter_demand: result.demand_letter,
          letter_ag_complaint: result.ag_complaint,
          letter_bbb: result.bbb_complaint,
          letter_ftc: result.ftc_guidance,
          documentation_checklist: result.documentation_checklist,
          small_claims_note: result.small_claims_note,
        })
        .select()
        .single();

      insertedDispute = data;
    } catch (dbError) {
      console.warn('dispute_letters insert failed', dbError);
    }

    return NextResponse.json({ dispute: insertedDispute ?? result, generated: result });
  } catch (error) {
    console.error('generate dispute error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate dispute package';
    const status = message.includes('ANTHROPIC_API_KEY') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
