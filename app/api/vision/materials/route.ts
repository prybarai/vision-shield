import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';
import { type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.enum(['budget', 'mid', 'premium']),
  estimate_mid: z.number(),
  generated_image_url: z.string().optional(),
  analysis: z.unknown().optional(),
  notes: z.string().optional(),
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder' });

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

function fallbackMaterials(category: string, style: string, qualityTier: string, estimateMid: number, analysis?: VisionAnalysis, notes?: string) {
  const common = {
    bathroom: [
      ['Demolition', 'Demo and disposal', 1, 'lot'],
      ['Tile & Flooring', `${style} floor tile`, 80, 'sq ft'],
      ['Tile & Flooring', `${style} wall tile`, 120, 'sq ft'],
      ['Fixtures', 'Vanity cabinet', 1, 'each'],
      ['Fixtures', 'Quartz or solid surface vanity top', 1, 'each'],
      ['Fixtures', 'Sink and faucet set', 1, 'set'],
      ['Fixtures', 'Toilet', 1, 'each'],
      ['Fixtures', 'Shower trim kit', 1, 'set'],
      ['Labor', 'Tile installation labor', 1, 'lot'],
      ['Labor', 'Plumbing and finish labor', 1, 'lot'],
    ],
    kitchen: [
      ['Cabinetry', `${style} kitchen cabinets`, 1, 'lot'],
      ['Countertops', 'Countertop fabrication and install', 1, 'lot'],
      ['Backsplash', `${style} backsplash tile`, 40, 'sq ft'],
      ['Fixtures', 'Sink and faucet set', 1, 'set'],
      ['Hardware', 'Cabinet hardware', 30, 'pieces'],
      ['Labor', 'Demolition and prep', 1, 'lot'],
      ['Labor', 'Cabinet installation labor', 1, 'lot'],
      ['Labor', 'Finish carpentry and paint touchups', 1, 'lot'],
    ],
  } as Record<string, Array<[string, string, number, string]>>;

  const customRows: Array<[string, string, number, string]> = [
    ['Demolition & Prep', 'Demolition, protection, and prep allowance', 1, 'lot'],
    ['Finish Materials', `${style} finish materials`, 1, 'lot'],
    ['Carpentry & Installation', 'Carpentry, framing, and installation allowance', 1, 'lot'],
    ['Paint & Finish', 'Paint, stain, caulk, and finish coat allowance', 1, 'lot'],
    ['Fixtures & Hardware', 'Fixtures, trim, and hardware allowance', 1, 'lot'],
    ['Labor', 'General labor and trade coordination', 1, 'lot'],
    ['Permits & Contingency', 'Permits, disposal, and contingency allowance', 1, 'lot'],
  ];

  const rows = category === 'custom_project'
    ? customRows
    : common[category] || [
      ['Materials', `${style} finish materials`, 1, 'lot'],
      ['Labor', `${category.replace(/_/g, ' ')} labor`, 1, 'lot'],
      ['Permits & Fees', 'Allowances and misc. fees', 1, 'lot'],
    ];

  const base = Math.max(estimateMid / Math.max(rows.length, 1), 500);
  return {
    line_items: rows.map(([cat, item, quantity, unit], i) => ({
      category: cat,
      item,
      description: `${qualityTier} tier ${item}`,
      quantity,
      unit,
      finish_tier: qualityTier,
      estimated_cost_low: Math.round(base * (0.7 + i * 0.02)),
      estimated_cost_high: Math.round(base * (1.0 + i * 0.03)),
      sourcing_notes: category === 'custom_project'
        ? 'Planning-grade custom scope allowance. Confirm exact materials, trade splits, and quantities during contractor quoting.'
        : 'Confirm exact finish and spec during contractor quoting.',
    })),
    sourcing_notes: category === 'custom_project'
      ? `Planning-grade custom project materials outline${analysis?.suggested_trade && analysis.suggested_trade !== 'unknown' ? ` inferred around ${analysis.suggested_trade.replace(/_/g, ' ')}` : ''}. Final selections and quantities should be confirmed onsite.${notes ? ` Homeowner notes considered: ${notes}` : ''}`
      : 'Planning-grade materials list. Final selections and quantities should be confirmed onsite.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const analysis = getAnalysis(params.analysis);

    let visualDescription = '';
    if (params.generated_image_url && !params.generated_image_url.startsWith('data:')) {
      try {
        const visionResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Describe the visible materials, finishes, and fixtures in this ${params.category} design concept in 3 short sentences.` },
              { type: 'image', source: { type: 'url', url: params.generated_image_url } },
            ],
          }],
        });
        const content = visionResponse.content[0];
        if (content.type === 'text') visualDescription = content.text;
      } catch (e) {
        console.error('Vision analysis failed:', e);
      }
    }

    let materials: { line_items: unknown[]; sourcing_notes: string };
    try {
      const prompt = `Generate a detailed, accurate materials list for a ${params.quality_tier}-tier ${params.category} renovation in ${params.style} style with an estimated budget of $${params.estimate_mid.toLocaleString()}.

${analysis ? `Uploaded photo analysis context:
- Visible features: ${analysis.visible_features.join(', ') || 'none noted'}
- Materials signals: ${analysis.materials_signals.join(', ') || 'none noted'}
- Estimation notes: ${analysis.estimation_notes.join(', ') || 'none noted'}
- Scope signals: ${JSON.stringify(analysis.scope_signals)}
- Suggested trade: ${analysis.suggested_trade || 'unknown'}
- Suggested location type: ${analysis.suggested_location_type || 'unknown'}
- Complexity: ${analysis.complexity || 'moderate'}` : ''}

${params.notes ? `Homeowner notes: ${params.notes}` : ''}

${visualDescription ? `The design concept shows: ${visualDescription}
The materials list should roughly match what is visible.` : analysis ? 'No generated concept image is available yet, so use the uploaded photo analysis as the main visual context.' : ''}

Output ONLY valid JSON:
{
  "line_items": [
    {
      "category": string,
      "item": string,
      "description": string,
      "quantity": number,
      "unit": string,
      "finish_tier": string,
      "estimated_cost_low": number,
      "estimated_cost_high": number,
      "sourcing_notes": string
    }
  ],
  "sourcing_notes": string
}

If category is custom_project, make the list useful for planning even when scope is mixed. Use broader line items when needed, note likely trades implied by the photo/notes, and keep it clearly planning-grade.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: 'You are a licensed general contractor and materials estimator. Output ONLY valid JSON with no markdown.',
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response');
      const jsonStr = content.text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
      materials = JSON.parse(jsonStr) as { line_items: unknown[]; sourcing_notes: string };
    } catch (aiError) {
      console.error('materials ai fallback:', aiError);
      materials = fallbackMaterials(params.category, params.style, params.quality_tier, params.estimate_mid, analysis, params.notes);
    }

    const { data, error } = await supabaseAdmin
      .from('material_lists')
      .insert({
        project_id: params.project_id,
        line_items: materials.line_items,
        sourcing_notes: materials.sourcing_notes,
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
