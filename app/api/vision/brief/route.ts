import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseClaudeJSON } from '@/lib/anthropic';
import { buildBriefPrompt } from '@/lib/prompts';

const schema = z.object({
  project_id: z.string().uuid(),
  category: z.string(),
  style: z.string(),
  quality_tier: z.string(),
  notes: z.string().optional(),
  estimate_low: z.number(),
  estimate_high: z.number(),
});

interface BriefResult {
  summary: string;
  homeowner_goals: string;
  contractor_notes: string;
  site_verification_questions: string[];
}

function fallbackBrief(params: z.infer<typeof schema>): BriefResult {
  const category = params.category.replace(/_/g, ' ');
  return {
    summary: `Homeowner is planning a ${params.quality_tier} ${category} project in a ${params.style} style with a planning budget of $${params.estimate_low.toLocaleString()}–$${params.estimate_high.toLocaleString()}.`,
    homeowner_goals: params.notes || `Wants a clean, practical ${category} upgrade that feels cohesive and ready for contractor pricing.`,
    contractor_notes: `Confirm measurements, existing conditions, code requirements, lead times, demolition scope, and finish selections before final quote.`,
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

    let result: BriefResult;
    try {
      const prompt = buildBriefPrompt({
        category: params.category,
        style: params.style,
        qualityTier: params.quality_tier,
        notes: params.notes,
        estimateLow: params.estimate_low,
        estimateHigh: params.estimate_high,
      });

      result = await parseClaudeJSON<BriefResult>(
        'You are a construction project manager creating contractor-ready briefs. Output ONLY valid JSON.',
        prompt
      );
    } catch (aiError) {
      console.error('brief ai fallback:', aiError);
      result = fallbackBrief(params);
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
