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

function normalizeResult(result: QuoteScanResult): QuoteScanResult {
  const clamped = Math.max(0, Math.min(100, Number(result.risk_score) || 0));
  const normalizedLevel = result.risk_level === 'low' || result.risk_level === 'medium' || result.risk_level === 'high'
    ? result.risk_level
    : clamped <= 30 ? 'low' : clamped <= 60 ? 'medium' : 'high';

  return {
    risk_score: clamped,
    risk_level: normalizedLevel,
    red_flags: Array.isArray(result.red_flags) ? result.red_flags : [],
    missing_terms: Array.isArray(result.missing_terms) ? result.missing_terms : [],
    questions_to_ask: Array.isArray(result.questions_to_ask) ? result.questions_to_ask : [],
    plain_english_summary: result.plain_english_summary || 'We could not generate a detailed summary for this document.',
    payment_structure_analysis: result.payment_structure_analysis || 'No payment structure analysis was returned.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const prompt = buildQuoteScanPrompt(params.raw_text);
    const result = normalizeResult(await parseClaudeJSON<QuoteScanResult>(
      'You are a consumer protection expert helping homeowners understand contractor quotes and contracts. Analyze the document for red flags, missing terms, and concerning payment structures. Be helpful and calm — never alarmist. Output ONLY valid JSON.',
      prompt,
    ));

    let insertedScan: Record<string, unknown> | null = null;
    try {
      const { data } = await supabaseAdmin
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

      insertedScan = data;
    } catch (dbError) {
      console.warn('quote_scans insert failed', dbError);
    }

    return NextResponse.json({ scan: insertedScan ?? result, analysis: result });
  } catch (error) {
    console.error('scan quote error:', error);
    const message = error instanceof Error ? error.message : 'Failed to scan quote';
    const status = message.includes('ANTHROPIC_API_KEY') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
