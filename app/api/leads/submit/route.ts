import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { dispatchLeadToPrybarCore } from '@/lib/prybar-core';
import { findPrybarRoutingMatch } from '@/lib/leadRouting';

const schema = z.object({
  project_id: z.string().uuid().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  zip_code: z.string().min(5),
  preferred_timing: z.enum(['asap', 'within_month', 'planning_ahead']),
  budget_range: z.enum(['under_5k', '5k_15k', '15k_50k', '50k_plus']),
  priority: z.enum(['budget', 'speed', 'quality']),
  notes: z.string().optional(),
  source: z.enum(['prybar_vision', 'prybar_shield']).optional(),
  defer_routing: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params = schema.parse(body);

    const source = params.source || (params.project_id ? 'prybar_vision' : 'prybar_shield');

    const [projectRes, estimateRes, briefRes] = params.project_id
      ? await Promise.all([
          supabaseAdmin.from('projects').select('*').eq('id', params.project_id).single(),
          supabaseAdmin.from('estimates').select('*').eq('project_id', params.project_id).order('created_at', { ascending: false }).limit(1).single(),
          supabaseAdmin.from('project_briefs').select('*').eq('project_id', params.project_id).order('created_at', { ascending: false }).limit(1).single(),
        ])
      : [{ data: null }, { data: null }, { data: null }];

    const project = projectRes.data as Record<string, unknown> | null;
    const estimate = estimateRes.data as Record<string, unknown> | null;
    const brief = briefRes.data as Record<string, unknown> | null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.naili.ai';
    const trimmedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const briefPath = project?.share_token ? `/share/${String(project.share_token)}` : params.project_id ? `/vision/results/${params.project_id}` : null;

    const insertPayload: Record<string, unknown> = {
      project_id: params.project_id ?? null,
      first_name: params.first_name,
      last_name: params.last_name,
      email: params.email,
      phone: params.phone || '',
      zip_code: params.zip_code,
      preferred_timing: params.preferred_timing,
      budget_range: params.budget_range,
      priority: params.priority,
      notes: params.notes,
      status: 'new',
      source,
      project_type: project?.project_category ? String(project.project_category) : null,
      scope_summary: brief?.summary ? String(brief.summary) : project?.notes ? String(project.notes) : null,
      brief_summary: brief?.summary ? String(brief.summary) : null,
      brief_url: briefPath ? `${trimmedBaseUrl}${briefPath}` : null,
      photo_urls: Array.isArray(project?.uploaded_image_urls) ? project.uploaded_image_urls : [],
      estimate_low: typeof estimate?.low_estimate === 'number' ? Number(estimate.low_estimate) : null,
      estimate_mid: typeof estimate?.mid_estimate === 'number' ? Number(estimate.mid_estimate) : null,
      estimate_high: typeof estimate?.high_estimate === 'number' ? Number(estimate.high_estimate) : null,
      assigned_contractor: null,
      admin_notes: null,
    };

    const legacyPayload: Record<string, unknown> = {
      project_id: params.project_id ?? null,
      first_name: params.first_name,
      last_name: params.last_name,
      email: params.email,
      phone: params.phone || '',
      zip_code: params.zip_code,
      preferred_timing: params.preferred_timing,
      budget_range: params.budget_range,
      priority: params.priority,
      notes: params.notes,
      status: 'new',
    };

    let insertResult = await supabaseAdmin.from('leads').insert(insertPayload).select().single();

    if (insertResult.error) {
      insertResult = await supabaseAdmin.from('leads').insert(legacyPayload).select().single();
    }

    if (insertResult.error || !insertResult.data) throw insertResult.error || new Error('Lead insert returned no data');
    const lead = insertResult.data as Record<string, unknown>;

    if (params.project_id) {
      await supabaseAdmin.from('projects').update({ status: 'lead_submitted' }).eq('id', params.project_id);
    }

    const routingDeferred = Boolean(params.defer_routing);

    const webhookConfigured = Boolean(process.env.PRYBAR_CORE_WEBHOOK_URL);
    const readyForDispatch = Boolean(project && estimate);
    const routeMatch = project?.project_category
      ? findPrybarRoutingMatch(params.zip_code, String(project.project_category))
      : null;
    const routedAt = new Date();
    const outboundReadyAt = new Date(routedAt.getTime() + 24 * 60 * 60 * 1000);

    let dispatchAttempted = false;
    let dispatchSucceeded = false;
    let leadStatus = 'new';
    const assignedContractor = !routingDeferred && routeMatch?.contractorName ? routeMatch.contractorName : null;
    let lastRoutingError: string | null = null;
    let adminNotes = typeof lead.admin_notes === 'string' ? String(lead.admin_notes) : '';

    if (!routingDeferred && routeMatch && webhookConfigured && readyForDispatch) {
      dispatchAttempted = true;
      dispatchSucceeded = await dispatchLeadToPrybarCore({
        source,
        lead_id: String(lead.id),
        created_at: routedAt.toISOString(),
        homeowner: {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email,
          phone: params.phone || '',
          zip_code: params.zip_code,
        },
        project: {
          category: String(project?.project_category || 'general_home_improvement'),
          location_type: (project?.location_type as 'interior' | 'exterior') || 'interior',
          address: project?.address ? String(project.address) : undefined,
          style_preference: project?.style_preference ? String(project.style_preference) : undefined,
          quality_tier: String(project?.quality_tier || 'standard'),
          notes: project?.notes ? String(project.notes) : undefined,
        },
        context: {
          generated_image_urls: Array.isArray(project?.generated_image_urls) ? project.generated_image_urls as string[] : [],
          uploaded_image_urls: Array.isArray(project?.uploaded_image_urls) ? project.uploaded_image_urls as string[] : [],
          estimate_range: {
            low: Number(estimate?.low_estimate || 0),
            mid: Number(estimate?.mid_estimate || 0),
            high: Number(estimate?.high_estimate || 0),
          },
          materials_summary: '',
          homeowner_goals: brief?.homeowner_goals ? String(brief.homeowner_goals) : '',
          brief_summary: brief?.summary ? String(brief.summary) : '',
          contractor_questions: Array.isArray(brief?.site_verification_questions) ? brief.site_verification_questions as string[] : [],
          risk_scan_completed: false,
        },
        intent: {
          preferred_timing: params.preferred_timing,
          budget_range: params.budget_range,
          priority: params.priority,
        },
        contractor_acquisition: {
          send_lead_alert: true,
          service_categories: [String(project?.project_category || 'general_home_improvement')],
        },
      });

      if (dispatchSucceeded) {
        leadStatus = 'routed_to_prybar';
        adminNotes = [adminNotes, `Auto-routed to Prybar for ${routeMatch.contractorName} on ${routedAt.toISOString()}. Escalate to outbound if no response is recorded within 24 hours.`]
          .filter(Boolean)
          .join('\n\n');
      } else {
        leadStatus = 'outbound';
        lastRoutingError = 'Matched Prybar coverage, but webhook dispatch did not succeed.';
        adminNotes = [adminNotes, `Matched Prybar coverage for ${routeMatch.contractorName}, but dispatch failed on ${routedAt.toISOString()}. Moved to outbound queue.`]
          .filter(Boolean)
          .join('\n\n');
      }
    } else if (!routingDeferred && routeMatch && !webhookConfigured) {
      lastRoutingError = 'Matched Prybar coverage, but PRYBAR_CORE_WEBHOOK_URL is not configured.';
      adminNotes = [adminNotes, `Matched Prybar coverage for ${routeMatch.contractorName}, but Prybar webhook routing is not configured yet.`]
        .filter(Boolean)
        .join('\n\n');
    } else if (!routingDeferred && routeMatch && !readyForDispatch) {
      lastRoutingError = 'Matched Prybar coverage, but the project context was incomplete for dispatch.';
      adminNotes = [adminNotes, `Matched Prybar coverage for ${routeMatch.contractorName}, but project data was incomplete, so the lead stayed in the queue.`]
        .filter(Boolean)
        .join('\n\n');
    } else if (!routingDeferred && !routeMatch) {
      leadStatus = 'outbound';
      adminNotes = [adminNotes, `No Prybar coverage rule matched ZIP ${params.zip_code} and trade ${project?.project_category ? String(project.project_category) : 'unknown'}, so the lead moved to outbound.`]
        .filter(Boolean)
        .join('\n\n');
    }

    const leadUpdates: Record<string, unknown> = {
      status: leadStatus,
      assigned_contractor: assignedContractor,
      admin_notes: adminNotes || null,
      last_routing_error: lastRoutingError,
      updated_at: routedAt.toISOString(),
    };

    if (leadStatus === 'routed_to_prybar') {
      leadUpdates.prybar_routed_at = routedAt.toISOString();
      leadUpdates.outbound_ready_at = outboundReadyAt.toISOString();
    } else if (leadStatus === 'outbound') {
      leadUpdates.outbound_ready_at = null;
    }

    let { error: leadUpdateError } = await supabaseAdmin
      .from('leads')
      .update(leadUpdates)
      .eq('id', String(lead.id));

    if (leadUpdateError) {
      const legacyStatus = leadStatus === 'routed_to_prybar'
        ? 'sent'
        : leadStatus === 'outbound'
        ? 'new'
        : leadStatus;

      const legacyUpdate = await supabaseAdmin
        .from('leads')
        .update({ status: legacyStatus, updated_at: routedAt.toISOString() })
        .eq('id', String(lead.id));

      leadUpdateError = legacyUpdate.error || null;

      if (leadUpdateError) {
        console.warn('lead update after routing failed', leadUpdateError);
      }
    }

    if (!routingDeferred && routeMatch && !webhookConfigured) {
      console.info('Lead saved without webhook dispatch because PRYBAR_CORE_WEBHOOK_URL is unset.', {
        lead_id: String(lead.id),
        source,
        email: params.email,
        phone: params.phone || '',
        zip_code: params.zip_code,
      });
    }

    return NextResponse.json({
      lead,
      routing: {
        status: leadStatus,
        matched_contractor: routeMatch?.contractorName || null,
        last_error: lastRoutingError,
        outbound_ready_at: leadStatus === 'routed_to_prybar' ? outboundReadyAt.toISOString() : null,
      },
      dispatch: {
        webhook_configured: webhookConfigured,
        attempted: dispatchAttempted,
        succeeded: dispatchSucceeded,
        pending_dispatch: !dispatchSucceeded,
        mode: routingDeferred
          ? 'saved_only'
          : leadStatus === 'routed_to_prybar'
          ? 'dispatched'
          : routeMatch && !dispatchSucceeded
          ? 'dispatch_pending'
          : !webhookConfigured
          ? 'saved_only'
          : 'saved_only',
        message: routingDeferred
          ? 'Thanks, you’re in. We’ll review your brief and reach out within 24 hours with 2–3 pros who want to quote this project.'
          : leadStatus === 'routed_to_prybar'
          ? `Lead saved and routed to Prybar for ${routeMatch?.contractorName || 'a matched contractor'}.`
          : leadStatus === 'outbound' && routeMatch
          ? `Lead saved. ${routeMatch.contractorName} matched in Prybar, but routing did not complete, so the lead moved to outbound.`
          : leadStatus === 'outbound'
          ? 'Lead saved and moved to the outbound queue because no Prybar route is available right now.'
          : routeMatch && !webhookConfigured
          ? 'Lead saved. Prybar coverage matched, but webhook routing is not configured yet.'
          : routeMatch && !readyForDispatch
          ? 'Lead saved. Prybar coverage matched, but project data was not ready for dispatch yet.'
          : 'Lead saved. Contractor routing will happen once the rest of the project data is ready.',
      },
    });
  } catch (error) {
    console.error('lead submit error:', error);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}
