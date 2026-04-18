import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import PrintBriefButton from '@/components/vision/PrintBriefButton';
import ProjectBriefDocument from '@/components/vision/ProjectBriefDocument';
import { DISCLAIMERS } from '@/lib/disclaimers';
import type { Estimate, MaterialList, Project, ProjectBrief } from '@/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: 'Shared project brief',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('share_token', token)
    .single();

  if (!project) notFound();

  const p = project as Project;

  const [{ data: estimate }, { data: brief }, { data: materials }] = await Promise.all([
    supabaseAdmin.from('estimates').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('project_briefs').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('material_lists').select('*').eq('project_id', p.id).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  const e = estimate as Estimate | null;
  const b = brief as ProjectBrief | null;
  const m = materials as MaterialList | null;
  const categoryLabel = p.project_category.replace(/_/g, ' ');
  const originalPhoto = p.uploaded_image_urls?.[0];
  const conceptImages = Array.isArray(p.generated_image_urls) ? p.generated_image_urls : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="blue" className="capitalize">{p.quality_tier} tier</Badge>
              <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
              <Badge variant={e || b ? 'green' : 'amber'}>{e || b ? 'Brief ready' : 'Still generating'}</Badge>
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f7cf7]">Shared via naili vision</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">Project brief for bid review</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              This link carries the same planning packet the homeowner is using to compare scope, cost range, and walk-through questions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              <div className="rounded-full bg-slate-100 px-4 py-2">ZIP {p.zip_code}</div>
              <div className="rounded-full bg-slate-100 px-4 py-2">{conceptImages.length} concept{conceptImages.length === 1 ? '' : 's'}</div>
              <div className="rounded-full bg-slate-100 px-4 py-2">{m?.line_items.length || 0} material items</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 print:hidden sm:flex-row lg:flex-col lg:min-w-[240px]">
            <PrintBriefButton label="Print brief" className="bg-[#1f7cf7] text-white hover:bg-[#0f5fc6]" />
            <Link href="/vision/start" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
              Start my own project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {(originalPhoto || conceptImages.length > 0) && (
        <section className="mb-8 grid gap-4 print:hidden lg:grid-cols-[0.85fr_1.15fr]">
          {originalPhoto && (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original photo</p>
              </div>
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image src={originalPhoto} alt="Original homeowner photo" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
              </div>
            </div>
          )}
          {conceptImages.length > 0 && (
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Concept direction</p>
                <a href={conceptImages[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f7cf7] hover:text-[#0f5fc6]">
                  Open image <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-3">
                {conceptImages.slice(0, 3).map((url, index) => (
                  <div key={url} className="overflow-hidden rounded-2xl bg-slate-100">
                    <div className="relative aspect-[4/3]">
                      <Image src={url} alt={`Concept ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                    </div>
                    <div className="px-4 py-3 text-sm font-semibold text-slate-900">Concept {index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <ProjectBriefDocument
        project={p}
        categoryLabel={categoryLabel}
        estimate={e}
        materials={m}
        brief={b}
        title="Shared project brief"
        subtitle="This document is meant to keep scope, assumptions, and walk-through questions aligned before pricing gets finalized onsite."
      />

      <Disclaimer text={DISCLAIMERS.estimate} className="mt-6" />

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-[#f8fbff] p-6 print:hidden sm:p-8">
        <h2 className="text-2xl font-bold text-slate-950">Want your own project plan?</h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Upload a photo and get concept images, a planning range, and a cleaner handoff brief before you talk to contractors.
        </p>
        <div className="mt-6">
          <Link href="/vision/start" className="inline-flex items-center gap-2 rounded-xl bg-[#1f7cf7] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0f5fc6]">
            Upload my project photo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
