import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Filter, Mail, MapPin, Phone, User } from 'lucide-react';
import { requireAdminUser } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatCurrencyRange } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types';
import { updateLeadQueueEntry } from './actions';

export const metadata: Metadata = {
  title: 'Lead Queue',
  description: 'Internal Naili lead queue for Prybar routing and outbound follow-up.',
};

const STATUS_OPTIONS: Array<{ value: LeadStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'routed_to_prybar', label: 'Routed to Prybar' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

const EDITABLE_STATUS_OPTIONS: LeadStatus[] = ['new', 'routed_to_prybar', 'outbound', 'converted', 'closed'];

function statusLabel(status: LeadStatus) {
  return status.replace(/_/g, ' ');
}

function priorityLabel(priority?: Lead['priority']) {
  if (!priority) return 'Not set';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function timingLabel(timing?: Lead['preferred_timing']) {
  switch (timing) {
    case 'asap':
      return 'ASAP';
    case 'within_month':
      return 'Within a month';
    case 'planning_ahead':
      return 'Planning ahead';
    default:
      return 'Not set';
  }
}

interface SearchParams {
  status?: string;
  zip?: string;
}

export default async function AdminLeadsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireAdminUser();
  const params = searchParams ? await searchParams : undefined;

  const statusFilter = STATUS_OPTIONS.some(option => option.value === params?.status)
    ? (params?.status as LeadStatus | 'all')
    : 'all';
  const zipFilter = (params?.zip || '').trim();

  let query = supabaseAdmin
    .from('leads')
    .select('*, project:projects(id, share_token, project_category, uploaded_image_urls)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  if (zipFilter) {
    query = query.ilike('zip_code', `${zipFilter}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'Failed to load leads');
  }

  const leads = (data || []) as Array<Lead & {
    project?: {
      id: string;
      share_token?: string | null;
      project_category?: string | null;
      uploaded_image_urls?: string[] | null;
    } | null;
  }>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,124,247,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Internal ops</p>
            <h1 className="mt-2 text-3xl font-bold">Naili lead queue</h1>
            <p className="mt-3 max-w-2xl text-white/75">
              Review new homeowner briefs, route the right ones into Prybar first, and use the rest for outbound signup conversion.
            </p>
            <p className="mt-3 text-sm text-white/55">Signed in as {user.email}</p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Loaded now</div>
            <div className="mt-2 text-3xl font-bold">{leads.length}</div>
            <div className="text-sm text-white/70">queue items</div>
          </div>
        </div>
      </section>

      <Card className="mt-8 p-5 sm:p-6">
        <form className="grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,200px)_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#48c7f1]"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">ZIP</span>
            <input
              name="zip"
              defaultValue={zipFilter}
              placeholder="Enter ZIP"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1]"
            />
          </label>

          <Button type="submit" className="w-full md:w-auto">
            <Filter className="mr-2 h-4 w-4" /> Apply filters
          </Button>
        </form>
      </Card>

      <div className="mt-8 space-y-5">
        {leads.length === 0 ? (
          <Card className="p-8 text-center text-slate-600">No leads match the current filters yet.</Card>
        ) : leads.map((lead) => {
          const projectType = lead.project_type || lead.project?.project_category?.replace(/_/g, ' ') || 'General home project';
          const photoUrls = Array.isArray(lead.photo_urls) && lead.photo_urls.length > 0
            ? lead.photo_urls
            : (Array.isArray(lead.project?.uploaded_image_urls) ? lead.project.uploaded_image_urls : []);
          const briefHref = lead.brief_url || (lead.project?.share_token ? `/share/${lead.project.share_token}` : null);
          const hasEstimate = typeof lead.estimate_low === 'number' && typeof lead.estimate_high === 'number';

          return (
            <Card key={lead.id} className="overflow-hidden p-0">
              <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
                <div className="border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
                  {photoUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrls[0]} alt={projectType} className="h-full min-h-[220px] w-full object-cover" />
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
                      No homeowner photo saved with this lead.
                    </div>
                  )}
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-semibold text-[#0f5fc6]">
                          {statusLabel(lead.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          ZIP {lead.zip_code}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">
                          {projectType}
                        </span>
                      </div>

                      <h2 className="mt-3 text-2xl font-bold text-slate-900">{lead.first_name} {lead.last_name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Created {new Date(lead.created_at).toLocaleString()} • Priority: {priorityLabel(lead.priority)} • Timing: {timingLabel(lead.preferred_timing)}
                      </p>
                    </div>

                    {briefHref && (
                      <Link href={briefHref} target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                        Open full brief <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><User className="h-4 w-4" /> Homeowner</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <div className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-slate-400" /><span>{lead.email}</span></div>
                        <div className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 text-slate-400" /><span>{lead.phone || 'Phone not provided yet'}</span></div>
                        <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /><span>ZIP {lead.zip_code}</span></div>
                      </div>
                    </div>

                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scope summary</div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">{lead.scope_summary || lead.brief_summary || 'No scope summary stored yet.'}</p>
                      {lead.notes && <p className="mt-3 text-sm text-slate-500">Homeowner note: {lead.notes}</p>}
                    </div>

                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimate + assets</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <div>{hasEstimate ? formatCurrencyRange(lead.estimate_low!, lead.estimate_high!) : 'Estimate not stored yet'}</div>
                        <div>{photoUrls.length} photo{photoUrls.length === 1 ? '' : 's'} attached</div>
                        <div>Source: {lead.source || 'naili'}</div>
                        {lead.assigned_contractor && <div>Prybar match: {lead.assigned_contractor}</div>}
                        {lead.outbound_ready_at && <div>Outbound if no response by: {new Date(lead.outbound_ready_at).toLocaleString()}</div>}
                        {lead.last_routing_error && <div className="text-amber-700">Routing note: {lead.last_routing_error}</div>}
                      </div>
                    </div>
                  </div>

                  <form action={updateLeadQueueEntry} className="mt-5 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 lg:grid-cols-[180px_minmax(0,240px)_minmax(0,1fr)_auto] lg:items-end">
                    <input type="hidden" name="lead_id" value={lead.id} />

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                      <select
                        name="status"
                        defaultValue={lead.status}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#48c7f1]"
                      >
                        {EDITABLE_STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Assigned contractor</span>
                      <input
                        name="assigned_contractor"
                        defaultValue={lead.assigned_contractor || ''}
                        placeholder="Name, shop, or Prybar account"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
                      <textarea
                        name="admin_notes"
                        rows={3}
                        defaultValue={lead.admin_notes || ''}
                        placeholder="Routing notes, outreach status, objections, or next step"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1] resize-none"
                      />
                    </label>

                    <Button type="submit" className="w-full lg:w-auto">Save</Button>
                  </form>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
