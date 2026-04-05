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
  letter_demand: string;
  letter_ag_complaint: string;
  letter_bbb: string;
  letter_ftc: string;
  documentation_checklist: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    if (!params.acknowledged_not_legal_advice) {
      return NextResponse.json({ error: 'Must acknowledge this is not legal advice' }, { status: 400 });
    }

    const contractorInfo: Record<string, string> = {};
    if (params.contractor_name) contractorInfo.name = params.contractor_name;
    if (params.contractor_business) contractorInfo.business = params.contractor_business;
    if (params.contractor_phone) contractorInfo.phone = params.contractor_phone;

    const prompt = buildDisputePrompt({
      situation: params.situation_description,
      contractorInfo,
      amountPaid: params.amount_paid,
      state: params.state,
      whatHappened: params.what_happened,
    });

    const result = await parseClaudeJSON<DisputeResult>(
      'You are a consumer rights expert helping homeowners create dispute documentation. Be thorough and professional. Output ONLY valid JSON.',
      prompt
    );

    const { data, error } = await supabaseAdmin
      .from('dispute_letters')
      .insert({
        session_id: params.session_id,
        situation_description: params.situation_description,
        contractor_info: contractorInfo,
        amount_paid: params.amount_paid,
        letter_demand: result.letter_demand,
        letter_ag_complaint: result.letter_ag_complaint,
        letter_bbb: result.letter_bbb,
        letter_ftc: result.letter_ftc,
        documentation_checklist: result.documentation_checklist,
        state: params.state,
        acknowledged_not_legal_advice: params.acknowledged_not_legal_advice,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ dispute: data });
  } catch (error) {
    console.error('dispute error:', error);
    return NextResponse.json({ error: 'Failed to generate dispute package' }, { status: 500 });
  }
}
