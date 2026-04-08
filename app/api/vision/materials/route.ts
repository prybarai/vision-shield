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

function customTradeHint(analysis?: VisionAnalysis, notes?: string) {
  const trades = new Set<string>();
  if (analysis?.suggested_trade && analysis.suggested_trade !== 'unknown') {
    trades.add(analysis.suggested_trade.replace(/_/g, ' '));
  }

  const noteText = notes?.toLowerCase() || '';
  if (noteText.includes('tile')) trades.add('tile installer');
  if (noteText.includes('paint')) trades.add('painting contractor');
  if (noteText.includes('cabinet')) trades.add('cabinet installer');
  if (noteText.includes('floor')) trades.add('flooring installer');
  if (noteText.includes('electrical') || noteText.includes('lighting')) trades.add('electrician');
  if (noteText.includes('plumb')) trades.add('plumber');
  if (noteText.includes('wall') || noteText.includes('framing')) trades.add('carpenter or framer');

  return Array.from(trades);
}

function fallbackMaterials(category: string, style: string, qualityTier: string, estimateMid: number, analysis?: VisionAnalysis, notes?: string) {
  const tradeHint = customTradeHint(analysis, notes);

  if (category === 'interior_paint') {
    const wallMultiplier = quantityMultiplier(analysis, 'wall');
    const roomMultiplier = analysis?.scope_signals.room_size === 'small' ? 0.85 : analysis?.scope_signals.room_size === 'large' ? 1.2 : 1;
    const gallons = Math.max(2, Math.round(3 * wallMultiplier * roomMultiplier));
    const trimGallons = Math.max(1, Math.round(1.5 * Math.max(1, wallMultiplier * 0.9)));
    const values = distributeBudget(estimateMid, [18, 20, 14, 28, 20]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Protection, masking, and prep package', 'Floor protection, masking, patching, sanding, caulk touch-up, and standard room setup before paint begins.', 1, 'lot', qualityTier, values[0] * 0.82, values[0], 'Confirm whether furniture moving, wallpaper removal, stain blocking, or skim coating are excluded.'),
        lineItem('Core Materials', 'Primer and wall paint system', `${qualityTier} interior primer and wall paint sized to the visible room scope and assumed repaint coverage.`, gallons, 'gallons', qualityTier, values[1] * 0.82, values[1], 'Final quantity depends on measured wall area, color change, and number of coats.'),
        lineItem('Finish Materials', 'Trim and door enamel allowance', `${qualityTier} enamel allowance for base, casing, doors, and other included trim surfaces.`, trimGallons, 'gallons', qualityTier, values[2] * 0.82, values[2], 'Reduce if trim is excluded. Increase for heavy trim packages or more doors.'),
        lineItem('Labor', 'Interior painting labor', 'Production labor for cut-in, rolling, detail work, punch touch-ups, and daily cleanup for the defined room scope.', 1, 'lot', qualityTier, values[3] * 0.82, values[3], 'Assumes occupied residential access with standard room conditions.'),
        lineItem('Permits / Misc', 'Cleanup and disposal allowance', 'Final debris removal, used masking disposal, and punch-list cleanup after completion.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Usually no permit required, but include as a miscellaneous closeout bucket.'),
      ],
      sourcing_notes: 'Planning-grade interior paint scope sheet sized from visible wall-area cues. This keeps the list closer to a contractor walk-through outline than a shopping list. Verify exact wall and ceiling area, opening count, trim inclusion, and prep severity onsite.',
    };
  }

  if (category === 'exterior_paint') {
    const wallMultiplier = quantityMultiplier(analysis, 'wall');
    const bodyGallons = Math.max(4, Math.round(6 * wallMultiplier));
    const trimGallons = Math.max(2, Math.round(3 * Math.max(0.9, wallMultiplier)));
    const values = distributeBudget(estimateMid, [18, 18, 14, 30, 20]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Wash, scrape, and surface-prep package', 'Pressure washing, scraping, sanding, spot repairs, caulking, and prep of visible elevations before coating.', 1, 'lot', qualityTier, values[0] * 0.82, values[0], 'Increase if widespread peeling, failing caulk, or repair carpentry is present.'),
        lineItem('Core Materials', 'Exterior field paint system', `${qualityTier} body paint, primer, and sundry materials sized to the visible exterior scope.`, bodyGallons, 'gallons', qualityTier, values[1] * 0.82, values[1], 'Confirm exact elevations, color count, and whether primer is full-coat or spot only.'),
        lineItem('Finish Materials', 'Trim, fascia, and accent coating package', 'Trim paint and finish materials for fascia, soffits, window trim, doors, and accent elements included in scope.', trimGallons, 'gallons', qualityTier, values[2] * 0.82, values[2], 'Useful when body and trim colors differ or detailed trim work is present.'),
        lineItem('Labor', 'Exterior painting and detail labor', 'Field labor for coating body surfaces, cutting around trim, protecting openings, and managing ladder or lift work.', 1, 'lot', qualityTier, values[3] * 0.82, values[3], 'Story height, access, and trim detail will swing this number the most.'),
        lineItem('Permits / Misc', 'Access, protection, and cleanup allowance', 'Masking, protection of hardscape and landscaping, access equipment, and final cleanup.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Verify if lift rental or scaffold is needed rather than ladder-only access.'),
      ],
      sourcing_notes: 'Exterior paint fallback is structured like a field estimate summary, not a retail materials cart. Visible facade cues were used conservatively. Verify exact elevations, prep severity, access method, and trim scope onsite.',
    };
  }

  if (category === 'flooring') {
    const floorMultiplier = quantityMultiplier(analysis, 'floor');
    const baseArea = analysis?.scope_signals.room_size === 'small' ? 110 : analysis?.scope_signals.room_size === 'large' ? 420 : 220;
    const floorArea = Math.round(baseArea * floorMultiplier);
    const values = distributeBudget(estimateMid, [16, 24, 12, 32, 16]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Existing flooring demo and subfloor prep', 'Removal of existing finish flooring, disposal, minor scrape/patch work, and basic subfloor prep for new installation.', floorArea, 'sq ft', qualityTier, values[0] * 0.82, values[0], 'Major leveling, moisture mitigation, or structural subfloor repair is typically separate.'),
        lineItem('Core Materials', 'Main flooring material package', `${qualityTier} ${style} flooring allowance sized to the inferred project area, including waste for cuts.`, floorArea, 'sq ft', qualityTier, values[1] * 0.82, values[1], 'Confirm exact product, thickness, wear layer, tile size, or wood grade before ordering.'),
        lineItem('Finish Materials', 'Underlayment, transitions, and trim accessories', 'Underlayment, moisture barrier, transition profiles, stair noses if needed, and trim-reset accessories.', floorArea, 'sq ft', qualityTier, values[2] * 0.82, values[2], 'Transition lengths and stair details should be measured at the site visit.'),
        lineItem('Labor', 'Floor installation labor', 'Layout, fitting, install labor, cuts, threshold work, and finish adjustments for the defined flooring area.', floorArea, 'sq ft', qualityTier, values[3] * 0.82, values[3], 'Pattern work, stairs, and tight layouts can materially increase labor.'),
        lineItem('Permits / Misc', 'Protection, cleanup, and reset allowance', 'Surface protection, debris haul-off, and closeout labor after installation is complete.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Furniture moving and appliance disconnect/reconnect should be confirmed separately.'),
      ],
      sourcing_notes: 'Flooring fallback is organized like a contractor-prep scope sheet. Visible floor-area cues drive quantities conservatively. Verify net square footage, subfloor condition, transitions, moisture, and stair conditions onsite.',
    };
  }

  if (category === 'deck_patio') {
    const yardMultiplier = quantityMultiplier(analysis, 'yard');
    const baseArea = analysis?.scope_signals.yard_size === 'small' ? 110 : analysis?.scope_signals.yard_size === 'large' ? 380 : 220;
    const deckArea = Math.round(baseArea * yardMultiplier);
    const values = distributeBudget(estimateMid, [18, 24, 14, 28, 16]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Site prep and demolition allowance', 'Layout, selective demo, excavation, and basic site prep for the proposed deck or patio footprint.', 1, 'lot', qualityTier, values[0] * 0.82, values[0], 'Grade correction, drainage work, or major haul-off may increase this bucket.'),
        lineItem('Core Materials', 'Structural framing and footing package', 'Footings, posts, beams, joists, base materials, and connectors sized to an inferred outdoor living footprint.', deckArea, 'sq ft', qualityTier, values[1] * 0.82, values[1], 'Final spans, footing count, and attachment details must be field-verified.'),
        lineItem('Finish Materials', 'Decking or patio finish package', `${qualityTier} exterior finish materials in the selected ${style} direction, including visible walking surfaces and railing parts if assumed.`, deckArea, 'sq ft', qualityTier, values[2] * 0.82, values[2], 'Confirm decking line, paver spec, railing style, skirting, and stair inclusion.'),
        lineItem('Labor', 'Build and installation labor', 'Crew labor for layout, footing work, framing, finish installation, fastening, and final adjustments.', 1, 'lot', qualityTier, values[3] * 0.82, values[3], 'Stairs, height off grade, access, and code railing needs can materially shift labor.'),
        lineItem('Permits / Misc', 'Permit, inspection, and cleanup allowance', 'Permit/admin allowance, inspection coordination, and final site cleanup after construction.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Important to confirm early for elevated decks or structural patio work.'),
      ],
      sourcing_notes: 'Deck and patio fallback is grouped the way many contractors mentally scope outdoor jobs. Visible yard cues help size the footprint conservatively. Verify footprint, footings, rails, stairs, drainage, and permit path onsite.',
    };
  }

  if (category === 'roofing') {
    const roofMultiplier = quantityMultiplier(analysis, 'roof');
    const baseRoofArea = analysis?.estimated_size_bucket === 'small' ? 1300 : analysis?.estimated_size_bucket === 'large' ? 3200 : 2100;
    const roofArea = Math.round(baseRoofArea * roofMultiplier);
    const values = distributeBudget(estimateMid, [18, 28, 12, 28, 14]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Tear-off, protection, and disposal package', 'Removal of existing roofing, site protection, dump fees, and cleanup associated with standard tear-off work.', roofArea, 'sq ft', qualityTier, values[0] * 0.82, values[0], 'Overlay scopes or multiple layers should be confirmed separately.'),
        lineItem('Core Materials', 'Primary roofing system', `${qualityTier} roofing material package sized to the inferred roof area, including underlayment and primary field material.`, roofArea, 'sq ft', qualityTier, values[1] * 0.82, values[1], 'Confirm shingle line, metal profile, warranty tier, and waste factor after measurement.'),
        lineItem('Finish Materials', 'Flashing, ventilation, and edge accessory package', 'Flashings, drip edge, boots, vents, ridge accessories, and leak-prone detail components.', Math.max(6, Math.round(roofArea / 250)), 'allowances', qualityTier, values[2] * 0.82, values[2], 'Chimneys, skylights, complex valleys, and gutter tie-ins can push this up.'),
        lineItem('Labor', 'Roof installation labor', 'Crew labor for tear-off, dry-in, install, flashing details, ridge work, and jobsite cleanup.', 1, 'lot', qualityTier, values[3] * 0.82, values[3], 'Pitch, story height, access, and complexity are the main labor variables.'),
        lineItem('Permits / Misc', 'Deck repair allowance and final closeout', 'Minor decking replacement allowance, permit/admin handling where needed, magnet sweep, and closeout cleanup.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Rotten decking beyond a light allowance should be treated as a change item.'),
      ],
      sourcing_notes: 'Roofing fallback is intentionally tighter and more professional than a broad materials list. It follows common bid buckets: tear-off, roofing system, accessories, labor, and closeout. Verify measurements, layers, deck condition, flashing details, and ventilation onsite.',
    };
  }

  if (category === 'custom_project') {
    const values = distributeBudget(estimateMid, [16, 24, 14, 30, 16]);
    return {
      line_items: [
        lineItem('Prep & Demo', 'Protection, demolition, and access prep', 'Planning allowance for setup, selective demolition, debris handling, and site protection tied to the custom scope.', 1, 'lot', qualityTier, values[0] * 0.82, values[0], 'Tighten after the field visit defines what stays, what goes, and how access works.'),
        lineItem('Core Materials', 'Primary build materials allowance', `Planning allowance for the main materials driving the custom scope${tradeHint.length ? `, with likely trade focus on ${tradeHint.join(', ')}` : ''}.`, 1, 'lot', qualityTier, values[1] * 0.82, values[1], 'Use this as a placeholder until exact assemblies, products, and quantities are verified.'),
        lineItem('Finish Materials', 'Finish selections and hardware allowance', 'Allowance for finish-facing materials, trim, hardware, and visible detail items that shape the final look.', 1, 'lot', qualityTier, values[2] * 0.82, values[2], 'Often the most variable category in mixed custom scopes.'),
        lineItem('Labor', 'Trade labor and coordination allowance', 'Combined labor allowance for installation, specialty trade work, sequencing, and jobsite coordination.', 1, 'lot', qualityTier, values[3] * 0.82, values[3], 'Split into individual trade bids once scope is field-verified.'),
        lineItem('Permits / Misc', 'Permits, engineering, and contingency allowance', 'Permit/admin placeholder plus a modest planning contingency for unknown conditions in a mixed custom scope.', 1, 'lot', qualityTier, values[4] * 0.82, values[4], 'Useful for scopes that may trigger design, code, or inspection requirements.'),
      ],
      sourcing_notes: `Planning-grade custom project scope sheet${tradeHint.length ? ` built around likely trade focus: ${tradeHint.join(', ')}` : ''}. This is intentionally grouped into contractor-style buckets so a field visit can convert it into a real scope and trade split.${notes ? ` Homeowner notes considered: ${notes}` : ''}`,
    };
  }

  const rows = [
    ['Prep & Demo', 'Protection, prep, and demolition allowance', 1, 'lot'],
    ['Core Materials', `${style} primary materials allowance`, 1, 'lot'],
    ['Finish Materials', 'Finish-facing materials and accessories', 1, 'lot'],
    ['Labor', `${category.replace(/_/g, ' ')} labor allowance`, 1, 'lot'],
    ['Permits / Misc', 'Miscellaneous allowances and closeout', 1, 'lot'],
  ] as Array<[string, string, number, string]>;

  const base = Math.max(estimateMid / Math.max(rows.length, 1), 500);
  return {
    line_items: rows.map(([cat, item, quantity, unit], i) => ({
      category: cat,
      item,
      description: `${qualityTier} planning allowance for ${item.toLowerCase()}.`,
      quantity,
      unit,
      finish_tier: qualityTier,
      estimated_cost_low: Math.round(base * (0.78 + i * 0.03)),
      estimated_cost_high: Math.round(base * (1.0 + i * 0.05)),
      sourcing_notes: 'Confirm exact trade scope, product specs, and measured quantities during contractor quoting.',
    })),
    sourcing_notes: 'Planning-grade materials outline organized into contractor-friendly estimate buckets. Final selections and quantities should be field-verified onsite.',
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
- Return 5 to 8 strong line items only. No filler.
- Group line items using these categories when practical: Prep & Demo, Core Materials, Finish Materials, Labor, Permits / Misc.
- Make the list feel like a contractor-prep scope sheet, not a retail shopping list.
- Keep the line items aligned to the visible scope and the estimate size. Avoid whole-home quantities unless the scope clearly suggests whole-home work.
- If category is paint, flooring, deck/patio, or roofing, make the list trade-specific.
- Include labor-oriented line items where useful, not just materials.
- Keep everything clearly planning-grade, but still concrete.
- Use size signals conservatively. Do not invent exact measurements, only plausible planning quantities consistent with visible scale.
- Prefer fewer, stronger items over many vague items.
- Each description should explain what the item is for.

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
