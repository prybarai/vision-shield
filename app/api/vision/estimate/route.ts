import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildEstimationPrompt } from '@/lib/prompts';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  location_type: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  zip_code: z.string(),
  notes: z.string().optional(),
});

interface EstimateResult {
  low_estimate: number;
  mid_estimate: number;
  high_estimate: number;
  assumptions: string[];
  risk_notes: string[];
  estimate_basis: string;
  regional_notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const { system, user } = buildEstimationPrompt({
      category: params.category,
      locationType: params.location_type,
      style: params.style,
      qualityTier: params.quality_tier,
      zipCode: params.zip_code,
      notes: params.notes,
    });

    const result = await parseClaudeJSON<EstimateResult>(system, user);

    const { data, error } = await supabaseAdmin
      .from('estimates')
      .insert({
        project_id: params.project_id,
        low_estimate: result.low_estimate,
        mid_estimate: result.mid_estimate,
        high_estimate: result.high_estimate,
        assumptions: result.assumptions,
        risk_notes: result.risk_notes,
        estimate_basis: result.estimate_basis,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('projects')
      .update({ status: 'estimated' })
      .eq('id', params.project_id);

    return NextResponse.json({ estimate: data });
  } catch (error) {
    console.error('estimate error:', error);
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 });
  }
}
