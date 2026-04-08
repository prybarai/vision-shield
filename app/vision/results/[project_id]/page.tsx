import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardList, Hammer, ImageIcon } from 'lucide-react';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { extractDesignConstraints } from '@/lib/designConstraints';
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

function buildRequestedDesignDirection(notes?: string): string | null {
  if (!notes) return null;

  const constraints = extractDesignConstraints(notes);

  if (constraints.bodyColor && constraints.accentColor && constraints.trimColor === constraints.accentColor) {
    return `${constraints.bodyColor} exterior with ${constraints.accentColor} accents`;
  }

  if (constraints.bodyColor && constraints.trimColor) {
    return `${constraints.bodyColor} exterior with ${constraints.trimColor} trim`;
  }

  if (constraints.deckMaterial) {
    return `${constraints.deckMaterial} deck material`;
  }

  if (constraints.flooringMaterial) {
    return `${constraints.flooringMaterial} flooring`;
  }

  if (constraints.cabinetColor || constraints.countertopMaterial || constraints.tileStyle) {
    return [constraints.cabinetColor ? `${constraints.cabinetColor} cabinetry` : null, constraints.countertopMaterial ? `${constraints.countertopMaterial} countertops` : null, constraints.tileStyle ? `${constraints.tileStyle} tile` : null]
      .filter(Boolean)
      .join(', ');
  }

  return null;
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

  const categoryLabel = project.project_category === 'custom_project'
    ? 'Custom Project'
    : toTitleCase(project.project_category);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${project.share_token}`;
  const analysisSummary = project.notes?.split('AI analysis:')[1]?.trim();
  const requestedDirection = project.generated_image_urls?.length > 0 ? buildRequestedDesignDirection(project.notes) : null;
  const likelyTrades = cleanList((brief as ProjectBrief & { likely_trades?: string[] } | null)?.likely_trades);
  const unknownsToVerify = cleanList((brief as ProjectBrief & { unknowns_to_verify?: string[] } | null)?.unknowns_to_verify);
  const suggestedSiteMeasurements = cleanList((brief as ProjectBrief & { suggested_site_measurements?: string[] } | null)?.suggested_site_measurements);
  const siteQuestions = cleanList(brief?.site_verification_questions);
  const estimateAssumptions = cleanList(estimate?.assumptions);
  const riskNotes = cleanList(estimate?.risk_notes);
  const sizeDrivenAssumptions = estimateAssumptions.filter((item) => /photo|visible|wall area|floor area|roof area|yard area|width|depth|confidence|story|window/i.test(item));
  const remainingAssumptions = estimateAssumptions.filter((item) => !sizeDrivenAssumptions.includes(item));
  const hasCorePlanning = Boolean(estimate || materials || brief);
  const hasAnyConcepts = Array.isArray(project.generated_image_urls) && project.generated_image_urls.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="blue">{project.quality_tier} tier</Badge>
            <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
            <Badge variant={hasCorePlanning ? 'green' : 'amber'}>
              {hasCorePlanning ? 'Planning outputs ready' : 'Still preparing outputs'}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{categoryLabel} plan</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Review your estimate, materials, contractor brief, and concept options in one place. If an AI section is still catching up, the rest of your project is still usable now.
          </p>
          {project.address && <p className="text-slate-500 mt-2">{project.address}</p>}
        </div>
        <ShareButton shareUrl={shareUrl} />
      </div>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Estimate
          </div>
          <p className="text-sm text-slate-500">{estimate ? 'Budget range and labor/material split are ready.' : 'Estimate is still generating. Refresh in a moment if needed.'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <Hammer className="h-4 w-4 text-blue-500" /> Materials
          </div>
          <p className="text-sm text-slate-500">{materials ? 'Material recommendations are organized for planning and quote review.' : 'Materials list is still being prepared.'}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1">
            <ClipboardList className="h-4 w-4 text-violet-500" /> Contractor brief
          </div>
          <p className="text-sm text-slate-500">{brief ? 'Walk-through notes and contractor questions are ready.' : 'Brief is still being drafted.'}</p>
        </div>
      </section>

      {analysisSummary && (
        <section className="mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-blue-900 mb-1">What Prybar picked up from your photo</h2>
            <p className="text-sm text-blue-800">{analysisSummary}</p>
          </div>
        </section>
      )}

      {estimate ? (
        <section className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Planning estimate</h2>
              <p className="text-sm text-slate-500 mt-1">A planning-grade budget range based on your uploaded photo, scope answers, and local pricing.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {project.project_category === 'custom_project' && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Planning-grade range for a custom scope. A field visit should tighten final quantities, trade splits, and pricing.
              </div>
            )}
            <div className="mb-4 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Prybar used uploaded photo analysis, visible scope cues, and your answers to avoid a generic benchmark-only estimate.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">What informed this range</h4>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Uploaded photo analysis and visible scope cues</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Project answers for category, style, and quality tier</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>ZIP-based regional pricing multiplier{estimate?.region_multiplier ? ` (${estimate.region_multiplier.toFixed(2)}x)` : ''}</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Low</div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(estimate.low_estimate)}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <div className="text-sm text-blue-600 mb-1 font-medium">Mid, most likely</div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(estimate.mid_estimate)}</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">High</div>
                <div className="text-2xl font-bold text-slate-700">{formatCurrency(estimate.high_estimate)}</div>
              </div>
            </div>
            <div className="text-center text-lg text-slate-600 mb-4 font-medium">
              Estimated range: {formatCurrencyRange(estimate.low_estimate, estimate.high_estimate)}
            </div>

            {(estimateAssumptions.length > 0 || hasText(estimate.estimate_basis) || estimate.estimate_breakdown) && (
              <div className="mb-4 space-y-4">
                {hasText(estimate.estimate_basis) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <h4 className="text-sm font-semibold text-slate-800 mb-1">Estimate basis</h4>
                    <p className="text-sm text-slate-600">{estimate.estimate_basis}</p>
                  </div>
                )}
                {estimate.estimate_breakdown && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Labor and materials split</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Labor</div>
                        <div className="text-sm font-medium text-slate-800 mb-1">
                          {formatCurrencyRange(estimate.estimate_breakdown.labor_low, estimate.estimate_breakdown.labor_high)}
                        </div>
                        <div className="text-xs text-slate-500">Mid: {formatCurrency(estimate.estimate_breakdown.labor_mid)}</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Materials</div>
                        <div className="text-sm font-medium text-slate-800 mb-1">
                          {formatCurrencyRange(estimate.estimate_breakdown.materials_low, estimate.estimate_breakdown.materials_high)}
                        </div>
                        <div className="text-xs text-slate-500">Mid: {formatCurrency(estimate.estimate_breakdown.materials_mid)}</div>
                      </div>
                    </div>
                  </div>
                )}
                {sizeDrivenAssumptions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Photo-based size and complexity signals</h4>
                    <ul className="space-y-1">
                      {sizeDrivenAssumptions.map((item, index) => (
                        <li key={index} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {remainingAssumptions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Other assumptions to confirm</h4>
                    <ul className="space-y-1">
                      {remainingAssumptions.map((item, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {riskNotes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Price drivers and risk factors</h4>
                <ul className="space-y-1">
                  {riskNotes.map((note, index) => (
                    <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>{note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Disclaimer text={DISCLAIMERS.estimate} className="mt-3" />
        </section>
      ) : (
        <section className="mb-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Planning estimate</h2>
            <p className="text-sm text-slate-600 mb-4">Your estimate is still being generated. This usually finishes shortly after the project page loads.</p>
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              You can still review the rest of the page now. If the estimate does not appear after a refresh, rerun the project from your dashboard.
            </div>
          </div>
        </section>
      )}

      {materials ? (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Materials plan</h2>
            <p className="text-sm text-slate-500 mt-1">Use this to sanity-check contractor allowances and keep the conversation grounded during quotes.</p>
          </div>
          <MaterialsAccordion materials={materials} />
        </section>
      ) : (
        <section className="mb-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Materials plan</h2>
            <p className="text-sm text-slate-600">The materials list is still being prepared. Your estimate and contractor brief can still help you move forward.</p>
          </div>
        </section>
      )}

      {brief ? (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Contractor-ready brief</h2>
            <p className="text-sm text-slate-500 mt-1">A walk-through summary you can use to frame scope, verify assumptions, and get cleaner bids.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            {project.project_category === 'custom_project' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Planning-grade brief for a custom scope. Use it to guide the walk-through, then tighten scope, trade splits, and measurements onsite.
              </div>
            )}
            {hasText(brief.summary) && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Scope summary</h4>
                <p className="text-slate-700">{brief.summary}</p>
              </div>
            )}
            {hasText(brief.homeowner_goals) && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Homeowner goals</h4>
                <p className="text-slate-700">{brief.homeowner_goals}</p>
              </div>
            )}
            {hasText(brief.contractor_notes) && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes for the contractor walk-through</h4>
                <p className="text-slate-700">{brief.contractor_notes}</p>
              </div>
            )}
            {likelyTrades.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Likely trades involved</h4>
                <div className="flex flex-wrap gap-2">
                  {likelyTrades.map((trade, index) => (
                    <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{trade}</span>
                  ))}
                </div>
              </div>
            )}
            {(unknownsToVerify.length > 0 || suggestedSiteMeasurements.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {unknownsToVerify.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Confirm onsite</h4>
                    <ul className="space-y-2">
                      {unknownsToVerify.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-amber-500 font-bold flex-shrink-0">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestedSiteMeasurements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Measurements to capture</h4>
                    <ul className="space-y-2">
                      {suggestedSiteMeasurements.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-emerald-500 font-bold flex-shrink-0">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {siteQuestions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Questions to ask before you approve a quote</h4>
                <ul className="space-y-2">
                  {siteQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-500 font-bold flex-shrink-0">{index + 1}.</span>{question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="mb-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Contractor-ready brief</h2>
            <p className="text-sm text-slate-600">Your brief is still being assembled. Once it finishes, this section will help you walk a contractor through scope and open questions.</p>
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Design concepts</h2>
            <p className="text-sm text-slate-500 mt-1">Optional visuals to help you react to a direction before talking to contractors.</p>
          </div>
          {!hasAnyConcepts && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Still rendering
            </div>
          )}
        </div>

        {requestedDirection && (
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Requested design direction</h3>
            <p className="text-sm text-slate-700 capitalize">{requestedDirection}</p>
          </div>
        )}

        {hasAnyConcepts ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {project.generated_image_urls.map((url: string, index: number) => (
              <div key={index} className="relative rounded-2xl overflow-hidden bg-slate-100 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Design concept ${index + 1}`}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="bg-white/90 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full shadow">
                    Option {index + 1}
                  </span>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                >
                  <span className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity">
                    View full size
                  </span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <ConceptsLoader
            projectId={project_id}
            category={project.project_category}
            style={project.style_preference || 'modern'}
            qualityTier={project.quality_tier}
            notes={project.notes || undefined}
            referenceImageUrl={project.uploaded_image_urls?.[0]}
            hasImages={false}
          />
        )}
      </section>

      <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-2">Ready to turn this plan into real quotes?</h2>
          <p className="text-blue-100 mb-6">Send your project details to vetted contractors, then use Shield to sanity-check anyone you’re considering before you hire.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/vision/results/${project_id}/connect`}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Get matched with contractors
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
      </div>
    </div>
  );
}
