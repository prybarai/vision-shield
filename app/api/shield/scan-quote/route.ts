import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildQuoteScanPrompt } from '@/lib/prompts';

const schema = z.object({
  raw_text: z.string().min(10),
  session_id: z.string().optional(),
  project_id: z.string().uuid().optional(),
});

interface QuoteScanResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  red_flags: Array<{ flag: string; explanation: string; severity: 'high' | 'medium' | 'low' }>;
  missing_terms: Array<{ term: string; why_important: string }>;
  questions_to_ask: string[];
  plain_english_summary: string;
  payment_structure_analysis: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const prompt = buildQuoteScanPrompt(params.raw_text);
    const result = await parseClaudeJSON<QuoteScanResult>(
      'You are a contractor quote and contract analysis expert. Help homeowners understand risks. Output ONLY valid JSON.',
      prompt
    );

    const { data, error } = await supabaseAdmin
      .from('quote_scans')
      .insert({
        session_id: params.session_id,
        project_id: params.project_id,
        raw_text: params.raw_text,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        red_flags: result.red_flags,
        missing_terms: result.missing_terms,
        questions_to_ask: result.questions_to_ask,
        plain_english_summary: result.plain_english_summary,
        payment_structure_analysis: result.payment_structure_analysis,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ scan: data });
  } catch (error) {
    console.error('scan quote error:', error);
    return NextResponse.json({ error: 'Failed to scan quote' }, { status: 500 });
  }
}
