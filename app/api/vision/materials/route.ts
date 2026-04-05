import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildMaterialsPrompt } from '@/lib/prompts';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  estimate_mid: z.number(),
});

interface MaterialsResult {
  line_items: Array<{
    category: string;
    item: string;
    quantity: number;
    unit: string;
    finish_tier: string;
    estimated_cost_low: number;
    estimated_cost_high: number;
    sourcing_notes: string;
  }>;
  sourcing_notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const prompt = buildMaterialsPrompt({
      category: params.category,
      style: params.style,
      qualityTier: params.quality_tier,
      estimateMid: params.estimate_mid,
    });

    const result = await parseClaudeJSON<MaterialsResult>(
      'You are a construction materials expert. Output ONLY valid JSON.',
      prompt
    );

    const { data, error } = await supabaseAdmin
      .from('material_lists')
      .insert({
        project_id: params.project_id,
        line_items: result.line_items,
        sourcing_notes: result.sourcing_notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ materials: data });
  } catch (error) {
    console.error('materials error:', error);
    return NextResponse.json({ error: 'Failed to generate materials list' }, { status: 500 });
  }
}
