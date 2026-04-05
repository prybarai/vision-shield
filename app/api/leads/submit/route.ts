import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dispatchLeadToPrybarCore } from '@/lib/prybar-core';

const schema = z.object({
  project_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  zip_code: z.string().min(5),
  preferred_timing: z.enum(['asap', 'within_month', 'planning_ahead']),
  budget_range: z.enum(['under_5k', '5k_15k', '15k_50k', '50k_plus']),
  priority: z.enum(['budget', 'speed', 'quality']),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    // Fetch project + estimate + brief for context
    const [projectRes, estimateRes, briefRes] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('id', params.project_id).single(),
      supabaseAdmin.from('estimates').select('*').eq('project_id', params.project_id).order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('project_briefs').select('*').eq('project_id', params.project_id).order('created_at', { ascending: false }).limit(1).single(),
    ]);

    const project = projectRes.data;
    const estimate = estimateRes.data;
    const brief = briefRes.data;

    // Insert lead
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        project_id: params.project_id,
        first_name: params.first_name,
        last_name: params.last_name,
        email: params.email,
        phone: params.phone,
        zip_code: params.zip_code,
        preferred_timing: params.preferred_timing,
        budget_range: params.budget_range,
        priority: params.priority,
        notes: params.notes,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    // Update project status
    await supabaseAdmin
      .from('projects')
      .update({ status: 'lead_submitted' })
      .eq('id', params.project_id);

    // Dispatch to Prybar Core (non-blocking)
    if (project && estimate) {
      dispatchLeadToPrybarCore({
        source: 'prybar_vision',
        lead_id: lead.id,
        created_at: new Date().toISOString(),
        homeowner: {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email,
          phone: params.phone,
          zip_code: params.zip_code,
        },
        project: {
          category: project.project_category,
          location_type: project.location_type,
          address: project.address,
          style_preference: project.style_preference,
          quality_tier: project.quality_tier,
          notes: project.notes,
        },
        context: {
          generated_image_urls: project.generated_image_urls || [],
          uploaded_image_urls: project.uploaded_image_urls || [],
          estimate_range: { low: estimate.low_estimate, mid: estimate.mid_estimate, high: estimate.high_estimate },
          materials_summary: '',
          homeowner_goals: brief?.homeowner_goals || '',
          brief_summary: brief?.summary || '',
          contractor_questions: brief?.site_verification_questions || [],
          risk_scan_completed: false,
        },
        intent: {
          preferred_timing: params.preferred_timing,
          budget_range: params.budget_range,
          priority: params.priority,
        },
        contractor_acquisition: {
          send_lead_alert: true,
          service_categories: [project.project_category],
        },
      }).catch(console.error);
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('lead submit error:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}
