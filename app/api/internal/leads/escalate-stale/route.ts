import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const headerSecret = req.headers.get('x-cron-secret');

  return bearer === secret || headerSecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data: staleLeads, error: fetchError } = await supabaseAdmin
    .from('leads')
    .select('id, admin_notes, assigned_contractor')
    .eq('status', 'routed_to_prybar')
    .lte('outbound_ready_at', now);

  if (fetchError) {
    console.error('Failed to load stale routed leads', fetchError);
    return NextResponse.json({ error: 'Failed to load stale leads' }, { status: 500 });
  }

  if (!staleLeads || staleLeads.length === 0) {
    return NextResponse.json({ escalated: 0 });
  }

  const escalatedIds: string[] = [];

  for (const lead of staleLeads) {
    const nextNotes = [lead.admin_notes, `Auto-escalated to outbound on ${now} after 24h with no Prybar response recorded.`]
      .filter(Boolean)
      .join('\n\n');

    const { error } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'outbound',
        admin_notes: nextNotes,
        updated_at: now,
      })
      .eq('id', lead.id);

    if (!error) {
      escalatedIds.push(lead.id);
    }
  }

  return NextResponse.json({ escalated: escalatedIds.length, lead_ids: escalatedIds });
}

