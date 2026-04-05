import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkContractorLicense } from '@/lib/careeronestop';
import { parseClaudeJSON } from '@/lib/anthropic';

const schema = z.object({
  contractor_name: z.string().optional(),
  contractor_phone: z.string().optional(),
  contractor_business_name: z.string().optional(),
  contractor_website: z.string().optional(),
  contractor_license_number: z.string().optional(),
  state: z.string().min(2).max(2),
  questionnaire_answers: z.record(z.string(), z.string()).optional(),
  session_id: z.string().optional(),
});

interface RiskAnalysis {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_flags: Array<{ flag: string; explanation: string; severity: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    // Check license
    const licenseResult = await checkContractorLicense({
      name: params.contractor_name,
      businessName: params.contractor_business_name,
      licenseNumber: params.contractor_license_number,
      state: params.state,
    });

    // AI risk analysis
    const riskPrompt = `Analyze contractor risk:
- Name: ${params.contractor_name || 'unknown'}
- Business: ${params.contractor_business_name || 'unknown'}
- Phone: ${params.contractor_phone || 'unknown'}
- Website: ${params.contractor_website || 'unknown'}
- License: ${params.contractor_license_number || 'not provided'}
- License status: ${licenseResult.status}
- State: ${params.state}
- Questionnaire: ${JSON.stringify(params.questionnaire_answers || {})}

Output JSON: {"risk_score":number(0-100),"risk_level":"low"|"medium"|"high","risk_flags":[{"flag":string,"explanation":string,"severity":"high"|"medium"|"low"}]}

Consider: no license info (high risk), expired license (high), no insurance mentioned (medium), no written contract (high), large upfront payment requested (high), verbal-only quote (medium).`;

    const riskAnalysis = await parseClaudeJSON<RiskAnalysis>(
      'You are a contractor fraud detection expert. Output ONLY valid JSON.',
      riskPrompt
    );

    const { data, error } = await supabaseAdmin
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
        risk_score: riskAnalysis.risk_score,
        risk_level: riskAnalysis.risk_level,
        risk_flags: riskAnalysis.risk_flags,
        questionnaire_answers: params.questionnaire_answers,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      scan: data,
      license: licenseResult,
      risk: riskAnalysis,
    });
  } catch (error) {
    console.error('check contractor error:', error);
    return NextResponse.json({ error: 'Failed to check contractor' }, { status: 500 });
  }
}
