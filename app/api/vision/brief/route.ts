import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildBriefPrompt } from '@/lib/prompts';
import { describeAnalysisFacts, type VisionAnalysis } from '@/lib/visionAnalysis';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  notes: z.string().optional(),
  estimate_low: z.number(),
  estimate_high: z.number(),
  analysis: z.unknown().optional(),
});

interface BriefResult {
  summary: string;
  homeowner_goals: string;
  contractor_notes: string;
  site_verification_questions: string[];
  likely_trades?: string[];
  unknowns_to_verify?: string[];
  suggested_site_measurements?: string[];
}

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

function uniqueItems(items: Array<string | undefined | null>) {
  return Array.from(new Set(items.filter((item): item is string => Boolean(item?.trim())).map(item => item!.trim())));
}

function inferLikelyTrades(category: string, analysis?: VisionAnalysis, notes?: string) {
  if (category === 'custom_project') {
    const suggested = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
      ? analysis.suggested_trade.replace(/_/g, ' ')
      : undefined;
    const noteText = notes?.toLowerCase() || '';
    const inferredFromNotes = [
      noteText.includes('electrical') || noteText.includes('lighting') ? 'electrician' : undefined,
      noteText.includes('plumb') ? 'plumber' : undefined,
      noteText.includes('cabinet') ? 'cabinet installer' : undefined,
      noteText.includes('tile') ? 'tile installer' : undefined,
      noteText.includes('drywall') ? 'drywall contractor' : undefined,
      noteText.includes('paint') ? 'painting contractor' : undefined,
      noteText.includes('floor') ? 'flooring installer' : undefined,
      noteText.includes('framing') || noteText.includes('wall') ? 'carpenter or framer' : undefined,
    ];

    return uniqueItems([
      suggested,
      ...inferredFromNotes,
      'general contractor or remodeler',
    ]);
  }

  if (category === 'interior_paint') return ['painting contractor', 'patch and prep crew'];
  if (category === 'exterior_paint') return ['painting contractor', 'minor exterior repair prep'];
  if (category === 'roofing') return ['roofing contractor', 'gutters/flashing'];
  if (category === 'flooring') return ['flooring installation', 'demo/disposal'];
  if (category === 'deck_patio') return ['carpentry', 'footings/foundation', 'railing'];
  if (category === 'landscaping') return ['landscape contractor', 'irrigation/drainage', 'low-voltage lighting if requested'];
  if (category === 'bathroom') return ['bathroom remodeler', 'plumber', 'tile installer'];
  if (category === 'kitchen') return ['kitchen remodeler', 'cabinet installer', 'countertop fabricator'];
  return ['general contractor'];
}

function fallbackSiteData(category: string, analysis?: VisionAnalysis, notes?: string) {
  const customTrade = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
    ? analysis.suggested_trade.replace(/_/g, ' ')
    : undefined;

  switch (category) {
    case 'roofing':
      return {
        likely_trades: ['roofing contractor', 'gutters/flashing'],
        unknowns_to_verify: ['Layer count', 'Decking condition', 'Flashing condition', 'Ventilation requirements'],
        suggested_site_measurements: ['Roof squares', 'Ridge length', 'Eaves and rake length', 'Penetrations and flashing counts'],
      };
    case 'interior_paint':
      return {
        likely_trades: ['painting contractor', 'patch/repair prep'],
        unknowns_to_verify: ['Wall condition', 'Exact opening count', 'Trim scope', 'Ceiling inclusion'],
        suggested_site_measurements: ['Wall area', 'Ceiling area', 'Trim linear footage'],
      };
    case 'exterior_paint':
      return {
        likely_trades: ['painting contractor', 'minor exterior repair prep'],
        unknowns_to_verify: ['Paint adhesion and peeling areas', 'Trim/fascia inclusion', 'Access equipment needs', 'Repair carpentry scope'],
        suggested_site_measurements: ['Paintable wall area by elevation', 'Trim and fascia linear footage', 'Window and door masking count'],
      };
    case 'flooring':
      return {
        likely_trades: ['flooring installation', 'demo/disposal'],
        unknowns_to_verify: ['Subfloor condition', 'Transitions', 'Levelness', 'Moisture'],
        suggested_site_measurements: ['Net floor area', 'Transition lengths', 'Stair nosings if any'],
      };
    case 'deck_patio':
      return {
        likely_trades: ['carpentry', 'footings/foundation', 'railing'],
        unknowns_to_verify: ['Final footprint', 'Code railing needs', 'Footing depth', 'Grade changes'],
        suggested_site_measurements: ['Deck footprint', 'Stair count', 'Railing length', 'Beam spans'],
      };
    case 'landscaping':
      return {
        likely_trades: ['landscape contractor', 'irrigation/drainage', 'low-voltage lighting if requested'],
        unknowns_to_verify: ['Exact planting-bed area', 'Drainage and grading needs', 'Irrigation and lighting scope', 'Which hardscape stays versus changes'],
        suggested_site_measurements: ['Planting-bed square footage', 'Lawn area', 'Edging linear footage', 'Driveway, walk, and patio boundaries to preserve'],
      };
    case 'custom_project':
      return {
        likely_trades: inferLikelyTrades(category, analysis, notes),
        unknowns_to_verify: ['Exact scope boundaries and exclusions', 'Measurements and quantities that drive final pricing', 'Trade coordination requirements', 'Permit, engineering, or code triggers'],
        suggested_site_measurements: ['Primary work area dimensions', 'Existing openings, fixtures, or affected surfaces', 'Access or demolition quantities'],
      };
    default:
      return {
        likely_trades: inferLikelyTrades(category, analysis, notes),
        unknowns_to_verify: ['Existing conditions behind finished surfaces', 'Final material selections and product specs', 'Scope inclusions like prep, disposal, and touch-ups'],
        suggested_site_measurements: ['Primary work area dimensions', 'Linear footage for trim or edges', 'Fixture or opening counts'],
      };
  }
}

function sizeSignalSummary(analysis?: VisionAnalysis) {
  if (!analysis) return '';
  const parts = [
    analysis.area_signals.wall_area_bucket ? `${analysis.area_signals.wall_area_bucket} wall area signal` : null,
    analysis.area_signals.floor_area_bucket ? `${analysis.area_signals.floor_area_bucket} floor area signal` : null,
    analysis.area_signals.roof_area_bucket ? `${analysis.area_signals.roof_area_bucket} roof area signal` : null,
    analysis.area_signals.yard_area_bucket ? `${analysis.area_signals.yard_area_bucket} yard area signal` : null,
    analysis.estimated_dimensions.width_bucket ? `${analysis.estimated_dimensions.width_bucket} width` : null,
    analysis.estimated_dimensions.depth_bucket ? `${analysis.estimated_dimensions.depth_bucket} depth` : null,
    analysis.confidence ? `${analysis.confidence} confidence` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : '';
}

function fallbackBrief(params: z.infer<typeof schema>, analysis?: VisionAnalysis): BriefResult {
  const category = params.category.replace(/_/g, ' ');
  const facts = describeAnalysisFacts(analysis).slice(0, 3).join(', ');
  const sizeSignals = sizeSignalSummary(analysis);
  const siteData = fallbackSiteData(params.category, analysis, params.notes);

  if (params.category === 'custom_project') {
    const likelyTrade = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
      ? analysis.suggested_trade.replace(/_/g, ' ')
      : 'mixed residential improvement scope';

    return {
      summary: `Homeowner wants help scoping a custom project with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}. Requested change: ${params.notes || 'Homeowner description pending.'}${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || 'Clarify the desired update, repair, redesign, or addition and turn it into a contractor-ready scope.',
      contractor_notes: `Likely trade focus is ${likelyTrade}. Convert the homeowner request into a clear field-ready scope, separate must-have work from optional upgrades, and tighten the biggest pricing unknowns before final quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'What exact work is included versus excluded in this custom scope?',
        'Which trades are actually required to complete the project properly?',
        'What measurements, utilities, framing, or structural conditions must be verified before pricing?',
        'Are there hidden conditions, demolition needs, or access constraints not visible in the photo?',
        'Will permits, engineering, inspections, or code upgrades be required?',
        'What alternate scope options should be quoted if budget becomes the constraint?',
      ],
      ...siteData,
    };
  }

  if (params.category === 'roofing') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} roofing project with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || 'Replace or upgrade the roof with a durable system, clean finish details, and a quote that clearly separates tear-off, materials, and accessory work.',
      contractor_notes: `Build a field visit around roof size confirmation, tear-off scope, flashing details, ventilation needs, and access constraints.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'What is the exact roof measurement, and how does it compare to the photo-based roof area assumption?',
        'How many roofing layers need to be removed, and is any section planned as overlay only?',
        'What is the condition of the roof decking once tear-off starts?',
        'Which flashing details, valleys, chimney areas, skylights, or penetrations need replacement?',
        'Are ridge vent, intake ventilation, or other ventilation upgrades required?',
        'What pitch, access, and fall-protection setup will affect crew labor?',
      ],
      ...siteData,
    };
  }

  if (params.category === 'interior_paint' || params.category === 'exterior_paint') {
    const isExterior = params.category === 'exterior_paint';
    return {
      summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || `Refresh the ${isExterior ? 'outside appearance' : 'interior painted space'} with a clean, cohesive finish and a quote that clearly defines prep, surfaces included, and final coats.`,
      contractor_notes: `Clarify exactly which wall, ceiling, trim, door, siding, fascia, or accent surfaces are included, then tighten prep assumptions before final quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'What exact wall, ceiling, trim, door, siding, or accent surfaces are included versus excluded?',
        'What is the true surface-prep condition, including peeling paint, cracks, patching, sanding, or caulking needs?',
        'What wall area, opening count, and ceiling height should be measured onsite to replace the photo-based assumption?',
        'Is there any lead paint risk, stain blocking, carpentry repair, or damage repair that should be priced separately?',
        'How many colors, sheens, and coats are expected in the final scope?',
        isExterior ? 'Will ladders, lift access, scaffold, or landscaping protection be required?' : 'What furniture moving, masking, and floor protection is expected?',
      ],
      ...siteData,
    };
  }

  if (params.category === 'flooring') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} flooring project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || 'Install updated flooring that looks cohesive, wears well, and includes clear allowances for demo, prep, transitions, and trim reset.',
      contractor_notes: `Confirm exact square footage, selected product, substrate readiness, and whether transitions and base work are included.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'What exact square footage, closets, and adjacent areas are included?',
        'How does the measured floor area compare to the photo-based flooring size assumption?',
        'Is demolition and disposal of existing flooring included?',
        'What subfloor prep, leveling, moisture mitigation, or crack isolation is needed?',
        'What product is being installed and what underlayment or waterproofing layer is required?',
        'Which transitions, stair noses, thresholds, and baseboard resets should be included?',
      ],
      ...siteData,
    };
  }

  if (params.category === 'landscaping') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} landscaping project in a ${params.style} direction with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || 'Improve curb appeal with cleaner planting areas, a more intentional yard plan, and a quote that separates planting, bed work, irrigation, lighting, and any hardscape changes.',
      contractor_notes: `Treat visible hardscape like driveway, walks, patio, or steps as keep-in-place unless the homeowner explicitly wants them changed. Confirm bed area, lawn area, drainage, irrigation, lighting, plant count, and exact preserve-versus-change boundaries before quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'Which visible areas are in scope for planting or lawn work, and which hardscape areas must stay exactly as they are?',
        'What exact planting-bed square footage, lawn area, and edging lengths should replace the photo-based assumption?',
        'Are grading, drainage correction, soil amendment, irrigation, or low-voltage lighting part of the actual scope?',
        'What existing trees, roots, shade, or utility conflicts will affect planting layout or trenching?',
        'Which driveway, walkway, patio, paver, or retaining-wall elements are to be preserved versus changed?',
        'What plant palette, maintenance expectations, and replacement warranty assumptions should be built into the quote?',
      ],
      ...siteData,
    };
  }

  if (params.category === 'deck_patio') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} deck patio project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      homeowner_goals: params.notes || 'Build or refresh an outdoor living area with a footprint and features that fit the yard and budget.',
      contractor_notes: `Confirm exact outdoor footprint, railing needs, footing requirements, grade changes, and access before final quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
      site_verification_questions: [
        'What exact deck or patio footprint should be measured onsite?',
        'Do grade changes, drainage, or soil conditions affect footing or base requirements?',
        'Are railings, stairs, skirting, or guards required by design or code?',
        'How will attachment details, setbacks, or existing structures affect layout?',
        'What demolition, haul-off, or site-prep work is included?',
        'Will permits, engineering, or inspections be required for the final design?',
      ],
      ...siteData,
    };
  }

  return {
    summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
    homeowner_goals: params.notes || `Wants a clean, practical ${category} upgrade that feels cohesive and ready for contractor pricing.`,
    contractor_notes: `Use this as a planning-grade field brief, not a final scope. Confirm measurements, existing conditions, code requirements, demolition scope, finish selections, and lead times before issuing a final quote.${facts ? ` Uploaded photo suggests ${facts}.` : ''}${sizeSignals ? ` Visible size cues suggest ${sizeSignals}.` : ''}`,
    site_verification_questions: [
      'What exact measurements need to be confirmed onsite before pricing?',
      'What existing conditions or hidden issues could affect the scope?',
      'Which material and finish selections are still open?',
      'What demolition, prep, or protection work should be included?',
      'Will permits, inspections, or code upgrades be required?',
      'What timeline assumptions should be built into the quote?',
    ],
    ...siteData,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);
    const analysis = getAnalysis(params.analysis);

    let result: BriefResult;
    try {
      const prompt = `${buildBriefPrompt({
        category: params.category,
        style: params.style,
        qualityTier: params.quality_tier,
        notes: params.notes,
        estimateLow: params.estimate_low,
        estimateHigh: params.estimate_high,
      })}
- Make this brief contractor-ready and practical for a real site visit.
- Use concise field language, not marketing language.
- Include likely trades involved.
- Include strong unknowns to verify onsite.
- Include suggested site measurements that would materially tighten pricing.
- Make site questions specific, not generic.
- Explicitly reflect homeowner goals, likely trade(s), top unknowns, and actionable site verification questions.
- If scope is mixed or custom, help a contractor understand what to verify before quoting.
- For roofing, ask about exact roof measurement, penetrations, layers to remove, decking condition, flashing or chimney penetrations, and ventilation upgrades.
- For flooring, ask about exact square footage, transitions, substrate condition, and product-specific install requirements.
- For paint, ask about exact wall/trim scope, wall condition, ceiling height, openings, prep condition, and lead paint, patching, or repair requirements.
- For deck/patio, ask about exact footprint, railing, footing requirements, grade changes, and permit triggers.
- Output valid JSON with fields: summary, homeowner_goals, contractor_notes, site_verification_questions, likely_trades, unknowns_to_verify, suggested_site_measurements.
${analysis ? `
- Uploaded photo analysis facts: ${describeAnalysisFacts(analysis).join(', ')}
- Space type: ${analysis.space_type || 'unknown'}
- Estimated project size: ${analysis.estimated_sqft || 'unknown'}
- Current materials: ${analysis.current_materials.join(', ') || 'none noted'}
- Current condition: ${analysis.current_condition || 'unknown'}
- Architectural features: ${analysis.architectural_features.join(', ') || 'none noted'}
- Existing style: ${analysis.existing_style || 'unknown'}
- Renovation scope: ${analysis.renovation_scope || 'unknown'}
- Key challenges: ${analysis.key_challenges.join(', ') || 'none noted'}
- Photo observations: ${analysis.photo_observations || 'none noted'}
- Customization notes: ${analysis.customization_notes || 'none noted'}
- Visible constraints: ${analysis.visible_constraints?.join(', ') || 'none noted'}
- Visible features: ${analysis.visible_features.join(', ') || 'none noted'}
- Size reasoning: ${analysis.size_reasoning.join(', ') || 'none noted'}
- Estimation notes: ${analysis.estimation_notes.join(', ') || 'none noted'}
- Estimated dimensions: ${JSON.stringify(analysis.estimated_dimensions)}
- Area signals: ${JSON.stringify(analysis.area_signals)}
- Confidence: ${analysis.confidence || 'unknown'}
- Suggested trade: ${analysis.suggested_trade || 'unknown'}
- Suggested location type: ${analysis.suggested_location_type || 'unknown'}
- Complexity: ${analysis.complexity || 'moderate'}` : ''}${params.category === 'custom_project' ? '\n- For custom_project briefs, emphasize the homeowner request, likely trades involved, top unknowns needing site verification, suggested site measurements, and strong contractor questions. Make the brief useful even if estimate scope is broad.' : ''}`;

      result = await parseClaudeJSON<BriefResult>(
        'You are a construction project manager creating contractor-ready briefs. Output ONLY valid JSON.',
        prompt
      );
    } catch (aiError) {
      console.error('brief ai fallback:', aiError);
      result = fallbackBrief(params, analysis);
    }

    const { data, error } = await supabaseAdmin
      .from('project_briefs')
      .insert({
        project_id: params.project_id,
        summary: result.summary,
        homeowner_goals: result.homeowner_goals,
        contractor_notes: result.contractor_notes,
        site_verification_questions: result.site_verification_questions,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('projects').update({ status: 'brief_generated' }).eq('id', params.project_id);

    return NextResponse.json({
      brief: {
        ...data,
        likely_trades: result.likely_trades,
        unknowns_to_verify: result.unknowns_to_verify,
        suggested_site_measurements: result.suggested_site_measurements,
      },
    });
  } catch (error) {
    console.error('brief error:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
