import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowRight, Camera, ClipboardCheck, FileText, Plus, Shield, Sparkles } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils';
import type { Project } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: homeowner } = await supabaseAdmin
    .from('homeowners')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  let projects: Project[] = [];
  if (homeowner) {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('homeowner_id', homeowner.id)
      .order('created_at', { ascending: false })
      .limit(12);
    projects = (data as Project[]) || [];
  }

  const projectIds = projects.map(project => project.id);
  const estimateMap = new Map<string, { low_estimate: number; high_estimate: number; mid_estimate: number }>();
  const shieldScanSummaries: Array<{ id: string; contractor_business_name?: string; risk_level: string; created_at: string }> = [];

  if (projectIds.length > 0) {
    const { data: estimates } = await supabaseAdmin
      .from('estimates')
      .select('project_id, low_estimate, mid_estimate, high_estimate, created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    for (const estimate of estimates || []) {
      if (!estimateMap.has(estimate.project_id)) {
        estimateMap.set(estimate.project_id, estimate);
      }
    }
  }

  if (homeowner) {
    const { data: scans } = await supabaseAdmin
      .from('contractor_scans')
      .select('id, contractor_business_name, risk_level, created_at')
      .order('created_at', { ascending: false })
      .limit(4);

    for (const scan of scans || []) {
      shieldScanSummaries.push(scan);
    }
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    estimated: 'Estimate ready',
    brief_generated: 'Brief ready',
    lead_submitted: 'Contractor matching started',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-2">Dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Prybar workspace</h1>
            <p className="text-slate-600 max-w-2xl leading-relaxed">Reopen project plans, review estimates, and move into contractor vetting only when you&apos;re ready.</p>
            <p className="text-sm text-slate-500 mt-3">Signed in as {user.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/vision/start"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New project
            </Link>
            <Link
              href="/shield"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Shield className="h-4 w-4" />
              Open Shield
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="/vision/start" className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Camera className="h-6 w-6 text-blue-600" />
          </div>
          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Start a Vision project</div>
          <div className="text-sm text-slate-500 mt-1">Upload a photo and get planning outputs.</div>
        </Link>
        <Link href="/connect" className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Find contractors</div>
          <div className="text-sm text-slate-500 mt-1">Move from planning into real quotes.</div>
        </Link>
        <Link href="/shield/check" className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardCheck className="h-6 w-6 text-slate-700" />
          </div>
          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Check a contractor</div>
          <div className="text-sm text-slate-500 mt-1">Verify before sending a deposit.</div>
        </Link>
        <Link href="/shield/scan" className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Scan a quote</div>
          <div className="text-sm text-slate-500 mt-1">Catch risky terms before you sign.</div>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your projects</h2>
            <p className="text-sm text-slate-500 mt-1">Saved plans, estimates, and next steps.</p>
          </div>
          {projects.length > 0 && (
            <Link href="/vision/start" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Start another project</Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 sm:p-14 text-center">
            <Camera className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto mb-6 leading-relaxed">
              Start with a photo, get a rough estimate and contractor brief, then return here anytime to compare options or move into Shield.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/vision/start"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" /> Start a project
              </Link>
              <Link
                href="/shield"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Shield className="h-4 w-4" /> Explore Shield first
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((project) => {
              const estimate = estimateMap.get(project.id);
              return (
                <Link
                  key={project.id}
                  href={`/vision/results/${project.id}`}
                  className="group rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {project.generated_image_urls?.[0] ? (
                    <div className="relative h-44 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.generated_image_urls[0]}
                        alt="Project concept"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {statusLabels[project.status] || project.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${project.generated_image_urls?.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {project.generated_image_urls?.length ? `${project.generated_image_urls.length} concept${project.generated_image_urls.length > 1 ? 's' : ''}` : 'Concepts pending'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 capitalize text-lg group-hover:text-blue-600 transition-colors">
                      {project.project_category.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">ZIP {project.zip_code} · {new Date(project.created_at).toLocaleDateString()}</p>
                    <div className="mt-4 space-y-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Estimate</div>
                        <div className="text-sm font-medium text-slate-900">
                          {estimate ? `${formatCurrency(estimate.low_estimate)} to ${formatCurrency(estimate.high_estimate)}` : 'Still generating'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Open results</span>
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {shieldScanSummaries.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Recent Shield checks</h2>
              <p className="text-sm text-slate-500 mt-1">A quick way to revisit contractor trust work.</p>
            </div>
            <Link href="/shield" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Open Shield</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {shieldScanSummaries.map((scan) => (
              <Link
                key={scan.id}
                href="/shield"
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {scan.contractor_business_name || 'Contractor check'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 capitalize">Risk: {scan.risk_level}</div>
                    <div className="text-xs text-slate-400 mt-2">{new Date(scan.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
