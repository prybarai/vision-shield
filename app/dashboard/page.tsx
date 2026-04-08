import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Eye, Shield, ArrowRight, Camera, Sparkles, FileText, ClipboardCheck } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { formatCurrency } from '@/lib/utils';
import type { Project } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get homeowner record
  const { data: homeowner } = await supabaseAdmin
    .from('homeowners')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  // Get projects
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

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    estimated: 'bg-blue-100 text-blue-700',
    brief_generated: 'bg-purple-100 text-purple-700',
    lead_submitted: 'bg-green-100 text-green-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
        </div>
        <Link
          href="/vision/start"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Link href="/vision/start" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Eye className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">New Vision Project</div>
            <div className="text-sm text-slate-500">AI concepts + cost estimate</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
        <Link href="/shield" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-slate-700" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Shield Tools</div>
            <div className="text-sm text-slate-500">Verify contractors + scan quotes</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
        <Link href="/connect" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Find a Contractor</div>
            <div className="text-sm text-slate-500">Move from planning into real quotes</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
        <Link href="/shield/scan" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all flex items-center gap-4 group">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Scan a Quote</div>
            <div className="text-sm text-slate-500">Catch risky payment or scope terms</div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Camera className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
            <p className="text-slate-400 text-sm mb-5">Start with a photo, get a planning estimate, then come back here to reopen concepts, briefs, and contractor next steps.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/vision/start"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Start a project
              </Link>
              <Link
                href="/shield"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Shield className="h-4 w-4" /> Use Shield tools
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/vision/results/${project.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                {project.generated_image_urls?.[0] ? (
                  <div className="relative h-40 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.generated_image_urls[0]}
                      alt="Project concept"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${project.generated_image_urls?.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {project.generated_image_urls?.length ? `${project.generated_image_urls.length} concept${project.generated_image_urls.length > 1 ? 's' : ''}` : 'No concepts yet'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 capitalize group-hover:text-blue-600 transition-colors">
                    {project.project_category.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Category: {project.project_category.replace(/_/g, ' ')} · ZIP: {project.zip_code}</p>
                  {estimateMap.get(project.id) && (
                    <p className="text-sm text-slate-700 mt-3 font-medium">
                      Estimate: {formatCurrency(estimateMap.get(project.id)!.low_estimate)} to {formatCurrency(estimateMap.get(project.id)!.high_estimate)}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {project.generated_image_urls?.length ? `${project.generated_image_urls.length} concept${project.generated_image_urls.length > 1 ? 's' : ''}` : 'No concepts yet'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                      {project.status === 'lead_submitted' ? 'Lead submitted' : 'Lead flow available'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    <span className="font-medium text-blue-600 group-hover:text-blue-700">Open project</span>
                  </div>
                  <div className="mt-3 flex gap-3 text-xs font-medium text-slate-500">
                    <span>Results</span>
                    <span>·</span>
                    <span>Connect flow</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {shieldScanSummaries.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Shield checks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shieldScanSummaries.map((scan) => (
              <Link
                key={scan.id}
                href="/shield"
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {scan.contractor_business_name || 'Contractor check'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 capitalize">Risk: {scan.risk_level}</div>
                    <div className="text-xs text-slate-400 mt-2">{new Date(scan.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
