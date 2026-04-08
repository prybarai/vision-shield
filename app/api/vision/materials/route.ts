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

function quantityMultiplier(analysis?: VisionAnalysis, kind?: 'wall' | 'floor' | 'roof' | 'yard') {
  const bucket = kind === 'wall'
    ? analysis?.area_signals.wall_area_bucket
    : kind === 'floor'
      ? analysis?.area_signals.floor_area_bucket
      : kind === 'roof'
        ? analysis?.area_signals.roof_area_bucket
        : analysis?.area_signals.yard_area_bucket;

  if (bucket === 'low') return 0.85;
  if (bucket === 'high') return 1.2;
  return 1;
}

function fallbackMaterials(category: string, style: string, qualityTier: string, estimateMid: number, analysis?: VisionAnalysis, notes?: string) {
  const tradeHint = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
    ? analysis.suggested_trade.replace(/_/g, ' ')
    : undefined;

  if (category === 'interior_paint') {
    const wallMultiplier = quantityMultiplier(analysis, 'wall');
    const roomMultiplier = analysis?.scope_signals.room_size === 'small' ? 0.85 : analysis?.scope_signals.room_size === 'large' ? 1.2 : 1;
    const gallons = Math.max(1, Math.round(2 * wallMultiplier * roomMultiplier));
    const trimGallons = Math.max(1, Math.round(1 * Math.max(1, wallMultiplier * 0.9)));
    const values = distributeBudget(estimateMid, [10, 12, 9, 7, 8, 24, 18, 12]);
    return {
      line_items: [
        lineItem('Protection', 'Masking, floor protection, and setup', 'Plastic, paper, tape, zipper doors, and room protection for the painted area', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Confirm whether furniture moving and full-room masking are included.'),
        lineItem('Prep', 'Patching, sanding, and caulk prep', 'Prep allowance for nail holes, cracks, minor patching, sanding, and caulk touch-up', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Upgrade if skim coating, stain blocking, or wallpaper removal is needed.'),
        lineItem('Primer', 'Spot primer and stain-blocking allowance', 'Primer for repairs, patched areas, and any visible bleed-through', 1, 'lot', qualityTier, values[2] * 0.8, values[2], 'Increase if smoke stains, water marks, or color-change coverage is heavy.'),
        lineItem('Paint', 'Wall and ceiling paint', `${qualityTier} interior paint allowance sized to visible wall area cues`, gallons, 'gallons', qualityTier, values[3] * 0.8, values[3], 'Confirm exact sheen, color count, and number of coats.'),
        lineItem('Paint', 'Trim and door enamel allowance', `${qualityTier} trim enamel for base, casing, and any included doors/trim`, trimGallons, 'gallons', qualityTier, values[4] * 0.8, values[4], 'Reduce if trim is excluded from scope.'),
        lineItem('Labor', 'Painting labor', 'Cut-in, rolling, and finish painting labor for visible room scope', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Pricing assumes standard occupancy and normal room access.'),
        lineItem('Labor', 'Prep and touch-up labor', 'Setup, patching, sanding, touch-up, and cleanup labor', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Hidden wall damage or extensive prep raises this bucket.'),
        lineItem('Cleanup', 'Cleanup and haul-off', 'Final cleanup, trash removal, and punch-list touch-up allowance', 1, 'lot', qualityTier, values[7] * 0.8, values[7], 'Confirm whether daily cleanup and final wipe-down are included.'),
      ],
      sourcing_notes: 'Contractor-usable planning list for interior painting. Sized for a defined room or limited interior scope, not whole-home paint. Visible wall-area cues were used to keep paint and prep quantities more plausible. Verify exact wall and trim scope, prep condition, primer needs, and whether ceilings/doors are included onsite.',
    };
  }

  if (category === 'exterior_paint') {
    const wallMultiplier = quantityMultiplier(analysis, 'wall');
    const bodyGallons = Math.max(3, Math.round(5 * wallMultiplier));
    const trimGallons = Math.max(2, Math.round(3 * Math.max(0.9, wallMultiplier)));
    const values = distributeBudget(estimateMid, [10, 12, 8, 10, 16, 22, 14, 8]);
    return {
      line_items: [
        lineItem('Prep', 'Wash, scrape, and surface prep', 'Pressure washing, scraping, sanding, and surface prep for visible siding and trim', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Increase if peeling paint, chalking, or failed coatings are widespread.'),
        lineItem('Prep', 'Caulk, filler, and spot-prime package', 'Exterior caulk, patch filler, and primer for joints, cracks, and repairs', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Lead-safe or heavy prep work is additional.'),
        lineItem('Paint', 'Body paint allowance', `${qualityTier} exterior field paint for body surfaces in selected color`, bodyGallons, 'gallons', qualityTier, values[2] * 0.8, values[2], 'Confirm final body color, sheen, and coat count.'),
        lineItem('Paint', 'Trim, fascia, and accent paint', 'Trim, fascia, soffit, and accent-color paint allowance', trimGallons, 'gallons', qualityTier, values[3] * 0.8, values[3], 'Needed especially when trim colors differ from body.'),
        lineItem('Protection', 'Masking windows, doors, and hardscape', 'Masking and protection allowance around windows, doors, lights, roofs, and adjacent surfaces', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Visible window count and landscaping can materially affect this item.'),
        lineItem('Labor', 'Body painting labor', 'Main field painting labor for siding or body surfaces', 1, 'lot', qualityTier, values[5] * 0.8, values[5], 'Story height and exterior access affect this heavily.'),
        lineItem('Labor', 'Trim and detail labor', 'Cut-in work around windows, trim, soffits, fascia, and architectural details', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Expect higher cost if many windows or detailed trim are present.'),
        lineItem('Access', 'Ladders, lift, and cleanup allowance', 'Access equipment, protection removal, and final cleanup', 1, 'lot', qualityTier, values[7] * 0.8, values[7], 'Lift or scaffold needs should be verified onsite.'),
      ],
      sourcing_notes: 'Exterior paint list is aligned to visible elevations and likely siding/trim scope. Visible wall-area and facade cues were used to keep paint quantities grounded. Confirm exact elevations included, trim detail, paint condition, access equipment, and any carpentry or lead-safe prep during the site visit.',
    };
  }

  if (category === 'flooring') {
    const floorMultiplier = quantityMultiplier(analysis, 'floor');
    const baseArea = analysis?.scope_signals.room_size === 'small' ? 110 : analysis?.scope_signals.room_size === 'large' ? 420 : 220;
    const floorArea = Math.round(baseArea * floorMultiplier);
    const values = distributeBudget(estimateMid, [12, 10, 18, 12, 22, 16, 10]);
    return {
      line_items: [
        lineItem('Demolition', 'Floor removal and disposal', 'Demo and disposal allowance for existing flooring if needed', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Remove or reduce if demo is excluded.'),
        lineItem('Prep', 'Subfloor prep and patching', 'Minor leveling, patching, and prep allowance', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Moisture issues or major leveling are additional.'),
        lineItem('Materials', 'Main flooring material', `${qualityTier} ${style} flooring material`, floorArea, 'sq ft', qualityTier, values[2] * 0.8, values[2], 'Confirm exact product, wear layer, wood grade, or tile spec.'),
        lineItem('Materials', 'Underlayment and moisture barrier', 'Required underlayment, pad, moisture barrier, or uncoupling layer', floorArea, 'sq ft', qualityTier, values[3] * 0.8, values[3], 'Material depends on product type and substrate.'),
        lineItem('Installation', 'Floor installation labor', 'Main install labor for the selected flooring scope', floorArea, 'sq ft', qualityTier, values[4] * 0.8, values[4], 'Tile patterns, stairs, or complicated layouts increase labor.'),
        lineItem('Finish Carpentry', 'Transitions, base reset, and trim work', 'Transitions, thresholds, shoe mould, and base reset allowance', analysis?.estimated_dimensions.width_bucket === 'wide' ? 5 : 3, 'allowances', qualityTier, values[5] * 0.8, values[5], 'Often missed in low bids, confirm explicitly.'),
        lineItem('Cleanup', 'Final cleanup and debris haul-off', 'Cleanup, haul-off, and protection removal', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Confirm furniture moving and appliance reset separately.'),
      ],
      sourcing_notes: 'Flooring list is trade-specific and sized for a contractor quote. Visible floor-area cues were used to keep square-foot quantities more plausible. Confirm exact square footage, selected flooring product, demo inclusion, transitions, and subfloor conditions onsite.',
    };
  }

  if (category === 'deck_patio') {
    const yardMultiplier = quantityMultiplier(analysis, 'yard');
    const baseArea = analysis?.scope_signals.yard_size === 'small' ? 110 : analysis?.scope_signals.yard_size === 'large' ? 380 : 220;
    const deckArea = Math.round(baseArea * yardMultiplier);
    const values = distributeBudget(estimateMid, [10, 16, 18, 10, 12, 14, 22, 8]);
    return {
      line_items: [
        lineItem('Site Prep', 'Layout, excavation, and prep', 'Basic site prep, layout, and excavation for the deck or patio footprint', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Soil issues, demo, or grading are additional if extensive.'),
        lineItem('Structure', 'Concrete footings and post bases', 'Concrete footings, post bases, and footing hardware allowance', Math.max(4, Math.round(deckArea / 55)), 'footings', qualityTier, values[1] * 0.8, values[1], 'Depth and footing count vary by code and site conditions.'),
        lineItem('Structure', 'Framing lumber package', 'Posts, beams, joists, blocking, and framing lumber or patio base structure', deckArea, 'sq ft', qualityTier, values[2] * 0.8, values[2], 'Attachment details and span requirements vary by site.'),
        lineItem('Finish Materials', 'Decking boards or patio finish material', `${qualityTier} exterior finish material in selected style`, deckArea, 'sq ft', qualityTier, values[3] * 0.8, values[3], 'Confirm exact decking species/composite line or paver spec.'),
        lineItem('Hardware', 'Structural connectors and fasteners', 'Structural connectors, hidden fasteners, flashing, and exterior-rated hardware', 1, 'lot', qualityTier, values[4] * 0.8, values[4], 'Critical for deck jobs, often under-scoped in rough estimates.'),
        lineItem('Railing', 'Railing and guard components', 'Posts, rails, balusters, and hardware if required', analysis?.estimated_dimensions.width_bucket === 'wide' || analysis?.estimated_dimensions.depth_bucket === 'deep' ? 1.2 : 1, 'allowance factor', qualityTier, values[5] * 0.8, values[5], 'Remove or reduce if railing is not part of scope.'),
        lineItem('Labor', 'Build and installation labor', 'Carpentry or masonry labor for footing, framing, decking, and finish installation', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Stairs, elevation changes, or access constraints increase labor.'),
        lineItem('Permit & Cleanup', 'Permit, inspection, and cleanup allowance', 'Permit/admin allowance and final site cleanup', 1, 'lot', qualityTier, values[7] * 0.8, values[7], 'Permit path should be confirmed before final quote.'),
      ],
      sourcing_notes: 'Deck/patio list is structured to match how contractors usually price outdoor living work. Visible yard-area and backyard scale cues were used to keep the assumed footprint more realistic. Confirm railing requirements, stairs, footing depth, framing spans, attachment details, demolition, and permit path onsite.',
    };
  }

  if (category === 'roofing') {
    const roofMultiplier = quantityMultiplier(analysis, 'roof');
    const baseRoofArea = analysis?.estimated_size_bucket === 'small' ? 1300 : analysis?.estimated_size_bucket === 'large' ? 3200 : 2100;
    const roofArea = Math.round(baseRoofArea * roofMultiplier);
    const values = distributeBudget(estimateMid, [14, 8, 10, 20, 10, 10, 18, 10]);
    return {
      line_items: [
        lineItem('Tear-Off', 'Existing roof tear-off and disposal', 'Tear-off, disposal, dump fees, and protection for existing roofing removal', 1, 'lot', qualityTier, values[0] * 0.8, values[0], 'Remove if this is truly an overlay scope.'),
        lineItem('Deck Prep', 'Deck inspection and dry-in prep', 'Minor deck prep, dry-in materials, and jobsite protection allowance', 1, 'lot', qualityTier, values[1] * 0.8, values[1], 'Rotten decking replacement is usually extra.'),
        lineItem('Protection', 'Synthetic underlayment and ice/water shield', 'Underlayment package for field areas, valleys, and leak-prone edges', roofArea, 'sq ft', qualityTier, values[2] * 0.8, values[2], 'Coverage varies by code, climate, and roof design.'),
        lineItem('Roofing', 'Shingles or roof panels', `${qualityTier} roofing material package sized to the inferred roof scope`, roofArea, 'sq ft', qualityTier, values[3] * 0.8, values[3], 'Confirm exact shingle, architectural, or metal system and warranty tier.'),
        lineItem('Flashing', 'Flashing, pipe boots, and edge metal', 'Accessory package for penetrations, walls, valleys, and roof edges', Math.max(6, Math.round(roofArea / 250)), 'allowances', qualityTier, values[4] * 0.8, values[4], 'Chimney, skylight, and complex flashing may add cost.'),
        lineItem('Ventilation', 'Ridge vent and ventilation accessories', 'Ridge vent, intake ventilation, and related accessories as needed', Math.max(20, Math.round(roofArea / 35)), 'linear ft', qualityTier, values[5] * 0.8, values[5], 'Ventilation upgrades should be confirmed onsite.'),
        lineItem('Labor', 'Roof installation labor', 'Crew labor for tear-off, install, flashing, and cleanup', 1, 'lot', qualityTier, values[6] * 0.8, values[6], 'Steep pitch, complexity, and access affect this heavily.'),
        lineItem('Cleanup', 'Final cleanup and magnet sweep', 'Debris removal, final jobsite cleanup, and magnetic nail sweep', 1, 'lot', qualityTier, values[7] * 0.8, values[7], 'Confirm same-day cleanup expectations.'),
      ],
      sourcing_notes: 'Roofing list is aligned to a contractor quote structure and inferred roof scope. Visible roof-area cues were used to keep underlayment, roofing, and accessory quantities more plausible. Confirm exact roof measurements, pitch, layers to remove, flashing/penetration details, ventilation upgrades, and whether decking repairs are excluded.',
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
- Use size signals conservatively. Do not invent exact measurements, only plausible planning quantities consistent with visible scale.

${analysis ? `Uploaded photo analysis context:
- Visible features: ${analysis.visible_features.join(', ') || 'none noted'}
- Size reasoning: ${analysis.size_reasoning.join(', ') || 'none noted'}
- Materials signals: ${analysis.materials_signals.join(', ') || 'none noted'}
- Estimation notes: ${analysis.estimation_notes.join(', ') || 'none noted'}
- Scope signals: ${JSON.stringify(analysis.scope_signals)}
- Estimated dimensions: ${JSON.stringify(analysis.estimated_dimensions)}
- Area signals: ${JSON.stringify(analysis.area_signals)}
- Confidence: ${analysis.confidence || 'unknown'}
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
