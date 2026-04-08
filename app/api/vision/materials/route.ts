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

function lineItem(category: string, item: string, description: string, quantity: number, unit: string, finish_tier: string, low: number, high: number, sourcing_notes: string) {
  return { category, item, description, quantity, unit, finish_tier, estimated_cost_low: low, estimated_cost_high: high, sourcing_notes };
}

function distributeBudget(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map(weight => Math.round((total * weight) / sum));
}

function fallbackMaterials(category: string, style: string, qualityTier: string, estimateMid: number, analysis?: VisionAnalysis, notes?: string) {
  const tradeHint = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
    ? analysis.suggested_trade.replace(/_/g, ' ')
    : undefined;

  if (category === 'interior_paint') {
    const values = distributeBudget(estimateMid, [8, 10, 7, 6, 18, 14, 10]);
    return {
      line_items: [
        lineItem('Protection', 'Masking and floor protection', 'Plastic, paper, tape, and room protection for the painted area', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Confirm whether furniture moving/protection is included.'),
        lineItem('Prep', 'Patch, sand, and caulk allowance', 'Wall prep for nail holes, minor cracks, and touch-up patching', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Upgrade if skim coating, stain blocking, or wallpaper removal is needed.'),
        lineItem('Paint', 'Wall paint', `${qualityTier} interior wall paint in selected color`, 2, 'gallons', qualityTier, values[2] * 0.8, values[2], 'Confirm exact sheen and number of coats.'),
        lineItem('Paint', 'Trim paint', `${qualityTier} trim enamel or trim-specific paint`, 1, 'gallon', qualityTier, values[3] * 0.8, values[3], 'Only needed if trim is included in scope.'),
        lineItem('Labor', 'Wall painting labor', 'Cut-in and roll labor for walls in visible scope', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Pricing assumes standard occupancy and access.'),
        lineItem('Labor', 'Prep and touch-up labor', 'Setup, prep, sanding, caulking, and cleanup labor', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Hidden wall damage can increase this bucket.'),
        lineItem('Cleanup', 'Cleanup and haul-off', 'Final cleanup, trash removal, and touch-up allowance', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Confirm whether daily cleanup and final wipe-down are included.'),
      ],
      sourcing_notes: 'Contractor-usable planning list for interior painting. Best for a single room or defined painted area, not whole-home paint. Verify exact wall area, prep needs, and whether ceilings/trim are included onsite.',
    };
  }

  if (category === 'exterior_paint') {
    const values = distributeBudget(estimateMid, [10, 12, 8, 18, 22, 16, 14]);
    return {
      line_items: [
        lineItem('Prep', 'Pressure wash and surface prep', 'Washing, scraping, sanding, and prep for visible siding/trim', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Increase if peeling paint, chalking, or rot repair is present.'),
        lineItem('Prep', 'Caulk, filler, and primer', 'Exterior caulk, spot primer, and patch materials', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Lead-safe or heavy prep work is additional.'),
        lineItem('Paint', 'Body paint', `${qualityTier} exterior body paint in selected color`, 5, 'gallons', qualityTier, values[2] * 0.8, values[2], 'Confirm final body color and sheen.'),
        lineItem('Paint', 'Trim and accent paint', 'Trim, soffit, fascia, and accent-color paint allowance', 3, 'gallons', qualityTier, values[3] * 0.8, values[3], 'Needed especially when trim/accent colors differ from body.'),
        lineItem('Labor', 'Siding painting labor', 'Main field painting labor for siding or body surfaces', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Story height and window count can materially affect this item.'),
        lineItem('Labor', 'Trim and masking labor', 'Cut-in labor around windows, trim, and other details', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Expect higher cost if many windows or detailed trim are present.'),
        lineItem('Access', 'Ladders, lift, and cleanup allowance', 'Access equipment, masking, and final cleanup', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Lift/scaffold needs should be verified onsite.'),
      ],
      sourcing_notes: 'Exterior paint list is aligned to visible elevations and likely siding/trim scope. Confirm exact elevations included, trim detail, paint condition, and any carpentry repairs during the site visit.',
    };
  }

  if (category === 'flooring') {
    const values = distributeBudget(estimateMid, [12, 10, 8, 20, 18, 14, 10]);
    return {
      line_items: [
        lineItem('Demolition', 'Floor removal and disposal', 'Demo and disposal allowance for existing flooring if needed', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Remove or reduce if demo is excluded.'),
        lineItem('Prep', 'Subfloor prep and patching', 'Minor leveling, patching, and prep allowance', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Moisture issues or major leveling are additional.'),
        lineItem('Materials', 'Main flooring material', `${qualityTier} ${style} flooring material`, 1, 'lot', qualityTier, values[2] * 0.8, values[2], 'Confirm exact product, wear layer, or tile spec.'),
        lineItem('Materials', 'Underlayment and moisture barrier', 'Required underlayment, pad, or uncoupling/waterproofing layer', 1, 'lot', qualityTier, values[3] * 0.8, values[3], 'Material depends on product type and substrate.'),
        lineItem('Installation', 'Floor installation labor', 'Main install labor for the selected flooring scope', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Tile patterns, stairs, or complicated layouts increase labor.'),
        lineItem('Finish Carpentry', 'Transitions, base reset, and trim work', 'Transitions, shoe mould, thresholds, and trim touch-up allowance', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Often missed in low bids, confirm explicitly.'),
        lineItem('Cleanup', 'Final cleanup and debris haul-off', 'Cleanup, haul-off, and protection removal', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Confirm furniture moving and appliance reset separately.'),
      ],
      sourcing_notes: 'Flooring list is trade-specific and sized for a contractor quote. Confirm exact square footage, selected flooring product, demo inclusion, and subfloor conditions onsite.',
    };
  }

  if (category === 'deck_patio') {
    const values = distributeBudget(estimateMid, [14, 10, 18, 16, 14, 18, 10]);
    return {
      line_items: [
        lineItem('Site Prep', 'Layout, excavation, and prep', 'Basic site prep and layout for deck or patio footprint', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Soil issues, demo, or grading are additional if extensive.'),
        lineItem('Structure', 'Footings and framing package', 'Footings, posts, beams, joists, or patio base materials', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Attachment and code requirements vary by site.'),
        lineItem('Finish Materials', 'Deck boards or patio surface material', `${qualityTier} exterior finish material in selected style`, 1, 'lot', qualityTier, values[2] * 0.8, values[2], 'Confirm exact decking species/composite line or paver spec.'),
        lineItem('Railing', 'Railing and guard components', 'Posts, rails, balusters, and hardware if required', 1, 'lot', qualityTier, values[3] * 0.8, values[3], 'Remove or reduce if railing is not part of scope.'),
        lineItem('Hardware', 'Fasteners, flashing, and connectors', 'Structural connectors, hidden fasteners, and exterior-rated hardware', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Critical for deck jobs, often under-scoped in rough estimates.'),
        lineItem('Labor', 'Build and installation labor', 'Carpentry or masonry labor for main installation', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Stairs, elevation changes, or access constraints increase labor.'),
        lineItem('Permit & Cleanup', 'Permit, inspection, and cleanup allowance', 'Permit/admin allowance and final site cleanup', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Permit path should be confirmed before final quote.'),
      ],
      sourcing_notes: 'Deck/patio list is structured to match how contractors usually price outdoor living work. Confirm railing requirements, stairs, footing depth, attachment details, and demolition onsite.',
    };
  }

  if (category === 'roofing') {
    const values = distributeBudget(estimateMid, [12, 8, 16, 10, 18, 24, 12]);
    return {
      line_items: [
        lineItem('Tear-Off', 'Existing roof removal and disposal', 'Tear-off, disposal, and dump fees for existing roofing', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Remove if this is truly an overlay scope.'),
        lineItem('Deck Prep', 'Deck inspection and minor prep allowance', 'Minor deck prep and dry-in materials', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Rotten decking replacement is usually extra.'),
        lineItem('Roofing', 'Main roofing material package', `${qualityTier} roofing material package sized to visible roof scope`, 1, 'lot', qualityTier, values[2] * 0.8, values[2], 'Confirm exact shingle/metal system and warranty tier.'),
        lineItem('Protection', 'Underlayment and ice/water shield', 'Synthetic underlayment and leak-prone area protection', 1, 'lot', qualityTier, values[3] * 0.8, values[3], 'Coverage varies by code, climate, and roof design.'),
        lineItem('Flashing & Ventilation', 'Flashing, pipe boots, ridge vent, and accessories', 'Accessory package for watertight installation', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Chimney, skylight, and complex flashing may add cost.'),
        lineItem('Labor', 'Roof installation labor', 'Crew labor for tear-off, install, and cleanup', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Steep pitch, complexity, and access affect this heavily.'),
        lineItem('Cleanup', 'Magnet sweep and final cleanup', 'Debris removal, jobsite cleanup, and magnetic nail sweep', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Confirm same-day cleanup expectations.'),
      ],
      sourcing_notes: 'Roofing list is aligned to a contractor quote structure and visible roof scope. Confirm exact roof measurements, pitch, complexity, flashing details, and whether decking repairs are excluded.',
    };
  }

  const common = {
    bathroom: [
      ['Demolition', 'Demo and disposal', 1, 'lot'],
      ['Tile & Flooring', `${style} floor tile`, 80, 'sq ft'],
      ['Tile & Flooring', `${style} wall tile`, 120, 'sq ft'],
      ['Fixtures', 'Vanity cabinet', 1, 'each'],
      ['Fixtures', 'Quartz or solid surface vanity top', 1, 'each'],
      ['Fixtures', 'Sink and faucet set', 1, 'set'],
      ['Fixtures', 'Toilet', 1, 'each'],
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
    ['Scope & Demo', 'Demolition, protection, and prep allowance', 1, 'lot'],
    ['Core Materials', `${style} finish materials`, 1, 'lot'],
    ['Carpentry', 'Carpentry, framing, and installation allowance', 1, 'lot'],
    ['Finish Work', 'Paint, trim, caulk, and finish coat allowance', 1, 'lot'],
    ['Fixtures', 'Fixtures, trim, and hardware allowance', 1, 'lot'],
    ['Labor', 'General labor and trade coordination', 1, 'lot'],
    ['Permit & Contingency', 'Permits, disposal, and planning contingency allowance', 1, 'lot'],
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
      estimated_cost_low: Math.round(base * (0.72 + i * 0.03)),
      estimated_cost_high: Math.round(base * (1.0 + i * 0.04)),
      sourcing_notes: category === 'custom_project'
        ? 'Planning-grade custom scope allowance. Confirm exact materials, trade splits, and quantities during contractor quoting.'
        : 'Confirm exact finish and spec during contractor quoting.',
    })),
    sourcing_notes: category === 'custom_project'
      ? `Planning-grade custom project materials outline${tradeHint ? ` inferred around ${tradeHint}` : ''}. Final selections, trade splits, and quantities should be confirmed onsite.${notes ? ` Homeowner notes considered: ${notes}` : ''}`
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
      const prompt = `Generate a contractor-usable materials list for a ${params.quality_tier}-tier ${params.category} renovation in ${params.style} style with an estimated planning budget of $${params.estimate_mid.toLocaleString()}.

Requirements:
- Return 6 to 12 strong line items only. No filler.
- Make the list feel like something a contractor or estimator would actually recognize.
- Keep the line items aligned to the visible scope and the estimate size. Avoid whole-home quantities unless the scope clearly suggests whole-home work.
- If category is paint, flooring, deck/patio, or roofing, make the list trade-specific.
- Include labor-oriented line items where useful, not just materials.
- Keep everything clearly planning-grade, but still concrete.

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
Match visible finishes and materials where practical.` : analysis ? 'No generated concept image is available yet, so use uploaded photo analysis as the main visual context.' : ''}

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

If category is custom_project, make the list useful for planning mixed scope work. Mention likely trade focus if it can be inferred from notes or image analysis.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2200,
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
