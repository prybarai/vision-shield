import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Share2, ChevronDown, AlertCircle } from 'lucide-react';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { formatCurrencyRange, formatCurrency } from '@/lib/utils';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/vision/ShareButton';
import MaterialsAccordion from '@/components/vision/MaterialsAccordion';
import type { Estimate, MaterialList, ProjectBrief, Project } from '@/types';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { project_id } = await params;
  return {
    title: `Project Results | Prybar`,
    openGraph: {
      images: [`/api/og/vision/${project_id}`],
    },
  };
}

export default async function VisionResultsPage({ params }: PageProps) {
  const { project_id } = await params;

  const [projectRes, estimateRes, materialsRes, briefRes] = await Promise.all([
    supabaseAdmin.from('projects').select('*').eq('id', project_id).single(),
    supabaseAdmin.from('estimates').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('material_lists').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
    supabaseAdmin.from('project_briefs').select('*').eq('project_id', project_id).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  if (!projectRes.data) notFound();

  const project = projectRes.data as Project;
  const estimate = estimateRes.data as Estimate | null;
  const materials = materialsRes.data as MaterialList | null;
  const brief = briefRes.data as ProjectBrief | null;

  const categoryLabel = project.project_category.replace(/_/g, ' ');
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${project.share_token}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="blue">{project.quality_tier} tier</Badge>
            <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 capitalize">{categoryLabel} Project</h1>
          {project.address && <p className="text-slate-500 mt-1">{project.address}</p>}
        </div>
        <ShareButton shareUrl={shareUrl} />
      </div>

      {/* Image Gallery */}
      {project.generated_image_urls?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">AI Design Concepts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {project.generated_image_urls.map((url: string, i: number) => (
              <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={url}
                  alt={`Concept ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Option {i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {project.generated_image_urls?.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">AI concepts are still generating. Refresh in a moment.</p>
        </div>
      )}

      {/* Cost Estimate */}
      {estimate && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Cost Estimate</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Low</div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(estimate.low_estimate)}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-blue-600 mb-1 font-medium">Mid (most likely)</div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(estimate.mid_estimate)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">High</div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(estimate.high_estimate)}</div>
              </div>
            </div>
            <div className="text-center text-lg text-slate-600 mb-4 font-medium">
              Range: {formatCurrencyRange(estimate.low_estimate, estimate.high_estimate)}
            </div>

            {estimate.assumptions?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Assumptions</h4>
                <ul className="space-y-1">
                  {estimate.assumptions.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {estimate.risk_notes?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Risk factors</h4>
                <ul className="space-y-1">
                  {estimate.risk_notes.map((n: string, i: number) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>{n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Disclaimer text={DISCLAIMERS.estimate} className="mt-3" />
        </section>
      )}

      {/* Materials List */}
      {materials && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Materials List</h2>
          <MaterialsAccordion materials={materials} />
        </section>
      )}

      {/* Project Brief */}
      {brief && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Project Brief</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</h4>
              <p className="text-slate-700">{brief.summary}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Homeowner Goals</h4>
              <p className="text-slate-700">{brief.homeowner_goals}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Contractor Notes</h4>
              <p className="text-slate-700">{brief.contractor_notes}</p>
            </div>
            {brief.site_verification_questions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Site Questions to Ask</h4>
                <ul className="space-y-2">
                  {brief.site_verification_questions.map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>{q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Ready to find a contractor?</h2>
        <p className="text-blue-100 mb-6">Get matched with verified contractors in your area. No pressure — free to connect.</p>
        <Link
          href={`/vision/results/${project_id}/connect`}
          className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Find a contractor
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
