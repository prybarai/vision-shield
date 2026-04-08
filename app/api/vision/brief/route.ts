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
}

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

function inferLikelyTrades(category: string, analysis?: VisionAnalysis) {
  if (category === 'custom_project') {
    const suggested = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
      ? analysis.suggested_trade.replace(/_/g, ' ')
      : undefined;
    return suggested ? [suggested, 'general contractor or remodeler'] : ['general contractor or remodeler'];
  }

  if (category === 'interior_paint' || category === 'exterior_paint') return ['painting contractor'];
  if (category === 'roofing') return ['roofing contractor'];
  if (category === 'flooring') return ['flooring contractor'];
  if (category === 'deck_patio') return ['deck builder or exterior contractor'];
  if (category === 'bathroom') return ['bathroom remodeler', 'plumber', 'tile installer'];
  if (category === 'kitchen') return ['kitchen remodeler', 'cabinet installer', 'countertop fabricator'];
  return ['general contractor'];
}

function fallbackBrief(params: z.infer<typeof schema>, analysis?: VisionAnalysis): BriefResult {
  const category = params.category.replace(/_/g, ' ');
  const facts = describeAnalysisFacts(analysis).slice(0, 3).join(', ');
  const likelyTrades = inferLikelyTrades(params.category, analysis);

  if (params.category === 'custom_project') {
    const likelyTrade = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
      ? analysis.suggested_trade.replace(/_/g, ' ')
      : 'mixed residential improvement scope';

    return {
      summary: `Homeowner wants help scoping a custom project with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}. Requested change: ${params.notes || 'Homeowner description pending.'}${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
      homeowner_goals: params.notes || 'Clarify the desired update, repair, redesign, or addition and turn it into a contractor-ready scope.',
      contractor_notes: `Likely trade focus is ${likelyTrade}. Convert the homeowner request into a clear scope, separate must-have work from optional upgrades, and tighten the biggest pricing unknowns before final quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
      site_verification_questions: [
        'What exact work is included versus excluded in this custom scope?',
        'Which trades are actually required to complete the project properly?',
        'What measurements, utilities, framing, or structural conditions must be verified before pricing?',
        'Are there hidden conditions, demolition needs, or access constraints not visible in the photo?',
        'Will permits, engineering, inspections, or code upgrades be required?',
        'What alternate scope options should be quoted if budget becomes the constraint?',
      ],
      likely_trades: likelyTrades,
      unknowns_to_verify: [
        'Exact scope boundaries and exclusions',
        'Measurements and quantities that drive final pricing',
        'Trade coordination requirements and sequencing',
        'Permit, engineering, or code triggers',
      ],
    };
  }

  if (params.category === 'roofing') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} roofing project with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
      homeowner_goals: params.notes || 'Replace or upgrade the roof with a durable system, clean finish details, and a quote that clearly separates tear-off, materials, and accessory work.',
      contractor_notes: `Likely trades: ${likelyTrades.join(', ')}. Build a quote around inferred roof size, material system, tear-off scope, flashing details, ventilation needs, and any access constraints.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
      site_verification_questions: [
        'How many roofing layers need to be removed, and is any section planned as overlay only?',
        'What is the condition of the roof decking once tear-off starts?',
        'Which flashing details, valleys, chimney areas, skylights, or penetrations need replacement?',
        'Are ridge vent, intake ventilation, or other ventilation upgrades required?',
        'What pitch, access, and fall-protection setup will affect crew labor?',
        'Are gutters, edge metal, or insurance scope items included or excluded?',
      ],
      likely_trades: likelyTrades,
      unknowns_to_verify: [
        'Layers to remove and disposal scope',
        'Roof decking condition under existing roofing',
        'Flashing, chimney, skylight, and penetration details',
        'Ventilation upgrades and code requirements',
      ],
    };
  }

  if (params.category === 'interior_paint' || params.category === 'exterior_paint') {
    const isExterior = params.category === 'exterior_paint';
    return {
      summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
      homeowner_goals: params.notes || `Refresh the ${isExterior ? 'outside appearance' : 'interior painted space'} with a clean, cohesive finish and a quote that clearly defines prep, surfaces included, and final coats.`,
      contractor_notes: `Likely trades: ${likelyTrades.join(', ')}. Clarify exactly which wall, ceiling, trim, door, siding, fascia, or accent surfaces are included, then tighten prep assumptions before final quoting.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
      site_verification_questions: [
        'What exact wall, ceiling, trim, door, siding, or accent surfaces are included versus excluded?',
        'What is the true surface-prep condition, including peeling paint, cracks, patching, sanding, or caulking needs?',
        'Is there any lead paint risk, stain blocking, carpentry repair, or damage repair that should be priced separately?',
        'How many colors, sheens, and coats are expected in the final scope?',
        isExterior ? 'Will ladders, lift access, scaffold, or landscaping protection be required?' : 'What furniture moving, masking, and floor protection is expected?',
        'Are touch-ups, cleanup, and punch-list return visits included in the quote?',
      ],
      likely_trades: likelyTrades,
      unknowns_to_verify: [
        'Exact painted surfaces and exclusions',
        'Surface prep condition and repair scope',
        'Lead-safe, primer, or stain-blocking requirements',
        'Color changes, sheen selections, and coat count',
      ],
    };
  }

  if (params.category === 'flooring') {
    return {
      summary: `Homeowner is planning a ${params.quality_tier} flooring project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
      homeowner_goals: params.notes || 'Install updated flooring that looks cohesive, wears well, and includes clear allowances for demo, prep, transitions, and trim reset.',
      contractor_notes: `Likely trades: ${likelyTrades.join(', ')}. Confirm exact square footage, selected product, substrate readiness, and whether transitions/base work are included.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
      site_verification_questions: [
        'What exact square footage, closets, and adjacent areas are included?',
        'Is demolition and disposal of existing flooring included?',
        'What subfloor prep, leveling, moisture mitigation, or crack isolation is needed?',
        'What product is being installed and what underlayment or waterproofing layer is required?',
        'Which transitions, stair noses, thresholds, and baseboard resets should be included?',
        'Will furniture moving, appliance reset, or phased installation affect labor?',
      ],
      likely_trades: likelyTrades,
      unknowns_to_verify: [
        'Exact square footage and layout breaks',
        'Subfloor condition, flatness, and moisture issues',
        'Demo inclusion and disposal scope',
        'Transitions, trim reset, stairs, and furniture moving',
      ],
    };
  }

  return {
    summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
    homeowner_goals: params.notes || `Wants a clean, practical ${category} upgrade that feels cohesive and ready for contractor pricing.`,
    contractor_notes: `Likely trades: ${likelyTrades.join(', ')}. Use this as a planning-grade brief, not a final scope. Confirm measurements, existing conditions, code requirements, demolition scope, finish selections, and lead times before issuing a final quote.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
    site_verification_questions: [
      'What exact measurements need to be confirmed onsite before pricing?',
      'What existing conditions or hidden issues could affect the scope?',
      'Which material and finish selections are still open?',
      'What demolition, prep, or protection work should be included?',
      'Will permits, inspections, or code upgrades be required?',
      'What timeline assumptions should be built into the quote?',
    ],
    likely_trades: likelyTrades,
    unknowns_to_verify: [
      'Existing conditions behind finished surfaces',
      'Final material selections and product specs',
      'Scope inclusions like prep, disposal, and touch-ups',
    ],
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
- Make this brief contractor-ready and practical.
- Include likely trades involved.
- Include strong unknowns to verify onsite.
- Make site questions specific, not generic.
- Explicitly reflect homeowner goals, likely trade(s), top unknowns, and actionable site verification questions.
- If scope is mixed or custom, help a contractor understand what to verify before quoting.
- For roofing, ask about layers to remove, decking condition, flashing or chimney penetrations, and ventilation upgrades.
- For paint, ask about exact wall/trim scope, prep condition, and lead paint, patching, or repair requirements.
- Output valid JSON with fields: summary, homeowner_goals, contractor_notes, site_verification_questions, likely_trades, unknowns_to_verify.
${analysis ? `
- Uploaded photo analysis facts: ${describeAnalysisFacts(analysis).join(', ')}
- Visible features: ${analysis.visible_features.join(', ') || 'none noted'}
- Estimation notes: ${analysis.estimation_notes.join(', ') || 'none noted'}
- Suggested trade: ${analysis.suggested_trade || 'unknown'}
- Suggested location type: ${analysis.suggested_location_type || 'unknown'}
- Complexity: ${analysis.complexity || 'moderate'}` : ''}${params.category === 'custom_project' ? '\n- For custom_project briefs, emphasize the homeowner request, likely trades involved, top unknowns needing site verification, and strong contractor questions. Make the brief useful even if estimate scope is broad.' : ''}`;

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

    return NextResponse.json({ brief: { ...data, likely_trades: result.likely_trades, unknowns_to_verify: result.unknowns_to_verify } });
  } catch (error) {
    console.error('brief error:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
