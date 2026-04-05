import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Eye, Shield, ArrowRight, Camera } from 'lucide-react';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
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
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Camera className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No projects yet</h3>
            <p className="text-slate-400 text-sm mb-4">Start your first project to get AI design concepts and estimates.</p>
            <Link
              href="/vision/start"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Start a project
            </Link>
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 capitalize group-hover:text-blue-600 transition-colors">
                    {project.project_category.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">ZIP: {project.zip_code}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
