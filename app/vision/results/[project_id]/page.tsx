import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ImageIcon, Info } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { formatCurrencyRange, formatCurrency } from '@/lib/utils';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/vision/ShareButton';
import MaterialsAccordion from '@/components/vision/MaterialsAccordion';
import ConceptsLoader from '@/components/vision/ConceptsLoader';
import type { Estimate, MaterialList, ProjectBrief, Project } from '@/types';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0 && value.trim().toLowerCase() !== 'null' && value.trim().toLowerCase() !== 'undefined');
}

function cleanList(items: unknown): string[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.toLowerCase() !== 'null' && item.toLowerCase() !== 'undefined');
}

export async function generateMetadata({ params }: PageProps) {
  const { project_id } = await params;
  return {
    title: 'Here’s your Naili plan',
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
  const categoryLabel = project.project_category === 'custom_project' ? 'Custom Project' : toTitleCase(project.project_category);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${project.share_token}`;
  const hasAnyConcepts = Array.isArray(project.generated_image_urls) && project.generated_image_urls.length > 0;
  const estimateAssumptions = cleanList(estimate?.assumptions);
  const riskNotes = cleanList(estimate?.risk_notes);
  const likelyTrades = cleanList((brief as ProjectBrief & { likely_trades?: string[] } | null)?.likely_trades);
  const siteQuestions = cleanList(brief?.site_verification_questions);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-7 shadow-sm mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="blue">{project.quality_tier} tier</Badge>
              <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
              <Badge variant={estimate || materials || brief ? 'green' : 'amber'}>
                {estimate || materials || brief ? 'Planning outputs ready' : 'Still preparing outputs'}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Here&apos;s your Naili plan</h1>
            <p className="text-slate-600 mt-3 max-w-2xl">
              {categoryLabel} project planning results, ready to help you compare quotes, ask better questions, and move forward with more confidence.
            </p>
          </div>
          <ShareButton shareUrl={shareUrl} />
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900 mb-1">What this should cost</div>
            <div className="text-sm text-slate-600">{estimate ? 'Budget range is ready.' : 'Still generating, check back in a moment.'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900 mb-1">Materials</div>
            <div className="text-sm text-slate-600">{materials ? 'Materials plan is ready.' : 'Still preparing material guidance.'}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900 mb-1">Your contractor-ready brief</div>
            <div className="text-sm text-slate-600">{brief ? 'Walk-through brief is ready.' : 'Still drafting contractor notes.'}</div>
          </div>
        </div>
      </section>

      {estimate ? (
        <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">What this should cost</h2>
            <p className="text-sm text-slate-500 mt-1">A planning-grade budget range based on your photo, project choices, and local pricing.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="text-sm text-slate-500 mb-1">Low</div>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(estimate.low_estimate)}</div>
            </div>
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
              <div className="text-sm text-blue-700 mb-1 font-medium">Mid (most likely)</div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(estimate.mid_estimate)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="text-sm text-slate-500 mb-1">High</div>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(estimate.high_estimate)}</div>
            </div>
          </div>
          <div className="text-center text-lg text-slate-600 font-medium mb-4">
            Range: {formatCurrencyRange(estimate.low_estimate, estimate.high_estimate)}
          </div>

          {estimateAssumptions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Assumptions</h3>
              <ul className="space-y-1">
                {estimateAssumptions.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskNotes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Risk factors</h3>
              <ul className="space-y-1">
                {riskNotes.map((item, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Disclaimer text={DISCLAIMERS.estimate} className="mt-4" />
        </section>
      ) : (
        <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What this should cost</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Your estimate is still generating. The rest of the page can still help you move forward, and this section usually fills in shortly after.</p>
        </section>
      )}

      {materials ? (
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Materials plan</h2>
            <p className="text-sm text-slate-500 mt-1">Use this to sanity-check allowances and keep quote conversations grounded.</p>
          </div>
          <MaterialsAccordion materials={materials} />
        </section>
      ) : (
        <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Materials plan</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Your materials list is still being prepared. You can still use the estimate and contractor brief in the meantime.</p>
        </section>
      )}

      {brief ? (
        <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Your contractor-ready brief</h2>
            <p className="text-sm text-slate-500 mt-1">A more useful way to frame scope, walk-through notes, and quote questions.</p>
          </div>
          <div className="space-y-5">
            {hasText(brief.summary) && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Summary</h3>
                <p className="text-slate-800 leading-relaxed">{brief.summary}</p>
              </div>
            )}

            {hasText(brief.homeowner_goals) && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Homeowner goals</h3>
                <p className="text-slate-800 leading-relaxed">{brief.homeowner_goals}</p>
              </div>
            )}

            {hasText(brief.contractor_notes) && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Walk-through notes</h3>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{brief.contractor_notes}</p>
              </div>
            )}

            {likelyTrades.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Likely trades</h3>
                <div className="flex flex-wrap gap-2">
                  {likelyTrades.map((trade, index) => (
                    <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{trade}</span>
                  ))}
                </div>
              </div>
            )}

            {siteQuestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Questions to ask before approving a quote</h3>
                <ul className="space-y-2">
                  {siteQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 font-bold flex-shrink-0">{index + 1}.</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your contractor-ready brief</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Your brief is still being assembled. Once it lands, this section will help you run a cleaner contractor walk-through.</p>
        </section>
      )}

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-slate-900">AI design concepts</h2>
        </div>

        {!hasAnyConcepts && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Your planning results are ready. Design concepts are still rendering in the background and may take a little longer.
            </p>
          </div>
        )}

        {hasAnyConcepts ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {project.generated_image_urls.map((url: string, index: number) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Design concept ${index + 1}`} className="w-full h-auto object-cover transition-transform group-hover:scale-[1.01]" />
                <div className="px-4 py-3 text-sm font-medium text-slate-800">Concept {index + 1}</div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <ImageIcon className="h-4 w-4" />
              Optional inspiration, not required for planning
            </div>
            <ConceptsLoader
              projectId={project_id}
              category={project.project_category}
              style={project.style_preference || 'modern'}
              qualityTier={project.quality_tier}
              notes={project.notes || undefined}
              referenceImageUrl={project.uploaded_image_urls?.[0]}
              hasImages={false}
            />
          </div>
        )}
      </section>

      <section className="bg-blue-600 rounded-[2rem] p-6 sm:p-8 text-white mb-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-2">Ready to make this happen?</h2>
          <p className="text-blue-100 mb-6">Use your estimate, materials plan, and contractor brief to start from a cleaner scope, then use Shield before you hire.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/vision/results/${project_id}/connect`}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Request contractor match
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shield/check"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Verify a contractor first
            </Link>
          </div>
        </div>
      </section>

      <Disclaimer text="Design concepts are optional inspiration only and may not reflect final buildable dimensions, code requirements, or contractor scope." />
    </div>
  );
}
