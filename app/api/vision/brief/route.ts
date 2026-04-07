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
}

function getAnalysis(input: unknown): VisionAnalysis | undefined {
  if (!input || typeof input !== 'object') return undefined;
  return input as VisionAnalysis;
}

function fallbackBrief(params: z.infer<typeof schema>, analysis?: VisionAnalysis): BriefResult {
  const category = params.category.replace(/_/g, ' ');
  const facts = describeAnalysisFacts(analysis).slice(0, 3).join(', ');

  if (params.category === 'custom_project') {
    const likelyTrade = analysis?.suggested_trade && analysis.suggested_trade !== 'unknown'
      ? analysis.suggested_trade.replace(/_/g, ' ')
      : 'mixed residential improvement scope';

    return {
      summary: `Homeowner wants help scoping a custom project with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}. Requested change: ${params.notes || 'Homeowner description pending.'}${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
      homeowner_goals: params.notes || 'Clarify the desired update, repair, redesign, or addition and turn it into a contractor-ready scope.',
      contractor_notes: `Likely trades involved: ${likelyTrade}. Prioritize translating the homeowner request into a clear scope, identifying the biggest unknowns, and separating must-have work from optional upgrades.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
      site_verification_questions: [
        'What exact work is included versus excluded in this custom scope?',
        'Which trades are required to complete the project properly?',
        'What existing conditions, damage, or access issues need verification onsite?',
        'What measurements, utilities, or structural conditions must be confirmed before pricing?',
        'Will permits, engineering, inspections, or code upgrades be required?',
        'What alternate scope options should be quoted if budget becomes the constraint?',
      ],
    };
  }

  return {
    summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.${facts ? ` Visible photo signals suggest ${facts}.` : ''}`,
    homeowner_goals: params.notes || `Wants a clean, practical ${category} upgrade that feels cohesive and ready for contractor pricing.`,
    contractor_notes: `Confirm measurements, existing conditions, code requirements, lead times, demolition scope, and finish selections before final quote.${facts ? ` Uploaded photo suggests ${facts}.` : ''}`,
    site_verification_questions: [
      'What existing conditions or hidden issues could affect the final scope?',
      'What measurements need to be confirmed onsite before pricing?',
      'Which material and finish selections are still open?',
      'Will permits, inspections, or code upgrades be required?',
      'What demolition, prep work, or disposal should be included?',
      'What timeline assumptions should be built into the quote?',
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
      })}${analysis ? `\n- Uploaded photo analysis facts: ${describeAnalysisFacts(analysis).join(', ')}\n- Visible features: ${analysis.visible_features.join(', ')}\n- Estimation notes: ${analysis.estimation_notes.join(', ')}\n- Suggested trade: ${analysis.suggested_trade || 'unknown'}\n- Suggested location type: ${analysis.suggested_location_type || 'unknown'}\n- Complexity: ${analysis.complexity || 'moderate'}` : ''}${params.category === 'custom_project' ? '\n- For custom_project briefs, emphasize the homeowner request, likely trades involved, top unknowns needing site verification, and strong contractor questions. Make the brief useful even if estimate scope is broad.' : ''}`;

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

    return NextResponse.json({ brief: data });
  } catch (error) {
    console.error('brief error:', error);
    return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 });
  }
}
