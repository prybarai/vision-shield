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
  regional_notes?: string;
}

function fallbackEstimate(category: string, qualityTier: string, zip: string, notes?: string): EstimateResult {
  const baseMid: Record<string, number> = {
    roofing: 16000,
    exterior_paint: 7000,
    deck_patio: 18000,
    landscaping: 10000,
    kitchen: 35000,
    bathroom: 18000,
    flooring: 8000,
    interior_paint: 4500,
  };

  let mid = baseMid[category] ?? 15000;
  const highCostStates = ['9', '0'];
  const mediumHighStates = ['1'];
  const firstZip = zip?.trim()?.[0] ?? '';

  if (qualityTier === 'budget') mid *= 0.75;
  if (qualityTier === 'premium') mid *= 1.45;
  if (highCostStates.includes(firstZip)) mid *= 1.2;
  else if (mediumHighStates.includes(firstZip)) mid *= 1.08;

  const low = Math.round(mid * 0.8 / 100) * 100;
  const high = Math.round(mid * 1.25 / 100) * 100;
  const roundedMid = Math.round(mid / 100) * 100;

  return {
    low_estimate: low,
    mid_estimate: roundedMid,
    high_estimate: high,
    assumptions: [
      `${qualityTier} quality finishes and materials`,
      `Typical labor rates for ZIP ${zip}`,
      `Standard scope for a ${category.replace(/_/g, ' ')} project`,
      notes ? `Included homeowner notes in planning assumptions` : 'No unusual site constraints assumed',
    ].filter(Boolean) as string[],
    risk_notes: [
      'Hidden damage, code upgrades, or site conditions can increase costs',
      'Final contractor pricing may vary based on measurements and material selections',
    ],
    estimate_basis: 'Fallback planning estimate based on project category benchmarks, quality tier, and ZIP-based regional adjustment.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    let result: EstimateResult;

    try {
      const { system, user } = buildEstimationPrompt({
        category: params.category,
        locationType: params.location_type,
        style: params.style,
        qualityTier: params.quality_tier,
        zipCode: params.zip_code,
        notes: params.notes,
      });
      result = await parseClaudeJSON<EstimateResult>(system, user);
    } catch (aiError) {
      console.error('estimate ai fallback:', aiError);
      result = fallbackEstimate(params.category, params.quality_tier, params.zip_code, params.notes);
    }

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

    await supabaseAdmin.from('projects').update({ status: 'estimated' }).eq('id', params.project_id);

    return NextResponse.json({ estimate: data });
  } catch (error) {
    console.error('estimate error:', error);
    return NextResponse.json({ error: 'Failed to generate estimate' }, { status: 500 });
  }
}
