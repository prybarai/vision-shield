import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Hammer,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
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
  const nextSteps = [
    'Use the brief to walk contractors through scope instead of explaining everything from scratch.',
    'Bring the materials plan and estimate assumptions into quote conversations so allowances stay grounded.',
    'Run Prybar Shield before paying a deposit or signing a quote that feels rushed.',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="blue">{project.quality_tier} tier</Badge>
              <Badge variant="gray" className="capitalize">{categoryLabel}</Badge>
              <Badge variant={hasCorePlanning ? 'green' : 'amber'}>
                {hasCorePlanning ? 'Planning outputs ready' : 'Still preparing outputs'}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-balance">{categoryLabel} project plan</h1>
            <p className="text-slate-600 mt-3 max-w-3xl leading-relaxed">
              This page is meant to help you frame the project, understand the rough budget, and show up to quote conversations with stronger scope notes. It is not a final bid.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              {project.zip_code && (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <MapPin className="h-4 w-4" />
                  ZIP {project.zip_code}
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <Sparkles className="h-4 w-4" />
                Concepts are optional inspiration
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              href={`/vision/results/${project_id}/connect`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Get matched with contractors
              <ArrowRight className="h-4 w-4" />
            </Link>
            <ShareButton shareUrl={shareUrl} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <div className="text-sm font-semibold text-blue-700 mb-1">Rough budget range</div>
          <div className="text-2xl font-bold text-slate-900">
            {estimate ? formatCurrencyRange(estimate.low_estimate, estimate.high_estimate) : 'In progress'}
          </div>
          <p className="text-sm text-slate-600 mt-2">Use this to set expectations before collecting quotes.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-700 mb-1">Most likely midpoint</div>
          <div className="text-2xl font-bold text-slate-900">{estimate ? formatCurrency(estimate.mid_estimate) : 'Pending'}</div>
          <p className="text-sm text-slate-600 mt-2">Helpful for deciding whether to proceed, phase the work, or downgrade finishes.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-700 mb-1">What you can bring to a contractor</div>
          <div className="text-lg font-bold text-slate-900">Estimate, materials, brief</div>
          <p className="text-sm text-slate-600 mt-2">Enough to tighten scope and compare bids more cleanly.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-700 mb-1">Best next trust check</div>
          <div className="text-lg font-bold text-slate-900">Prybar Shield</div>
          <p className="text-sm text-slate-600 mt-2">Verify who you hire before a deposit, contract, or rushed signature.</p>
        </div>
      </section>

      {analysisSummary && (
        <section className="mb-8">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="text-sm font-semibold text-blue-900 mb-2">What Prybar picked up from your photo</h2>
            <p className="text-sm leading-relaxed text-blue-900/90">{analysisSummary}</p>
          </div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr] mb-10">
        <div className="space-y-8">
          {estimate ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Planning estimate</h2>
                  <p className="text-sm text-slate-600 mt-1">A rough budget range based on your uploaded photo, answers, quality tier, and local pricing.</p>
                </div>
                <Badge variant="blue">Planning use only</Badge>
              </div>

              {project.project_category === 'custom_project' && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Custom scope projects usually tighten a lot after a site visit. Treat this as a smart starting range, not a locked bid.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500 mb-1">Low</div>
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(estimate.low_estimate)}</div>
                </div>
                <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 text-center">
                  <div className="text-sm text-blue-700 mb-1 font-medium">Most likely</div>
                  <div className="text-2xl font-bold text-blue-700">{formatCurrency(estimate.mid_estimate)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-center">
                  <div className="text-sm text-slate-500 mb-1">High</div>
                  <div className="text-2xl font-bold text-slate-800">{formatCurrency(estimate.high_estimate)}</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">What is driving this range</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Visible scope and condition cues from your uploaded photo</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>Your project category, style direction, and finish tier</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span>ZIP-based pricing{estimate.region_multiplier ? ` using a ${estimate.region_multiplier.toFixed(2)}x regional multiplier` : ''}</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">What can move it up or down</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {(riskNotes.length > 0 ? riskNotes : [
                      'Hidden repairs, prep work, access issues, and permit requirements',
                      'Material upgrades, layout changes, and site conditions not obvious from one photo',
                      'Contractor overhead, timeline urgency, and how complete the final scope becomes',
                    ]).map((note, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {estimate.estimate_breakdown && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Labor and materials split</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Labor</div>
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        {formatCurrencyRange(estimate.estimate_breakdown.labor_low, estimate.estimate_breakdown.labor_high)}
                      </div>
                      <div className="text-xs text-slate-500">Midpoint: {formatCurrency(estimate.estimate_breakdown.labor_mid)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Materials</div>
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        {formatCurrencyRange(estimate.estimate_breakdown.materials_low, estimate.estimate_breakdown.materials_high)}
                      </div>
                      <div className="text-xs text-slate-500">Midpoint: {formatCurrency(estimate.estimate_breakdown.materials_mid)}</div>
                    </div>
                  </div>
                </div>
              )}

              {(sizeDrivenAssumptions.length > 0 || remainingAssumptions.length > 0 || hasText(estimate.estimate_basis)) && (
                <div className="space-y-4">
                  {hasText(estimate.estimate_basis) && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Estimate basis</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{estimate.estimate_basis}</p>
                    </div>
                  )}
                  {sizeDrivenAssumptions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Photo-based assumptions</h3>
                      <ul className="space-y-2">
                        {sizeDrivenAssumptions.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-500 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {remainingAssumptions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">Items to verify onsite</h3>
                      <ul className="space-y-2">
                        {remainingAssumptions.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-slate-400 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Planning estimate</h2>
              <p className="text-sm text-slate-600 mb-4">Your estimate is still finishing up. The rest of your project page may already be usable.</p>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Refresh in a moment if needed. If it still does not appear, reopen this project from your dashboard.
              </div>
            </section>
          )}

          {materials ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Materials plan</h2>
                <p className="text-sm text-slate-600 mt-1">Use this to review allowances, compare finish levels, and keep quote conversations specific.</p>
              </div>
              <MaterialsAccordion materials={materials} />
            </section>
          ) : (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Materials plan</h2>
              <p className="text-sm text-slate-600">The materials list is still being prepared, but your estimate and brief can still help you move forward.</p>
            </section>
          )}

          {brief ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Contractor-ready brief</h2>
                <p className="text-sm text-slate-600 mt-1">This is the part you can bring into a walk-through so scope feels more concrete from the start.</p>
              </div>

              <div className="space-y-5">
                {project.project_category === 'custom_project' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    For custom projects, expect a contractor visit to tighten measurements, trade scope, and the final sequence of work.
                  </div>
                )}

                {hasText(brief.summary) && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Scope summary</h3>
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
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Likely trades involved</h3>
                    <div className="flex flex-wrap gap-2">
                      {likelyTrades.map((trade, index) => (
                        <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{trade}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(unknownsToVerify.length > 0 || suggestedSiteMeasurements.length > 0) && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {unknownsToVerify.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Confirm onsite</h3>
                        <ul className="space-y-2">
                          {unknownsToVerify.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-amber-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {suggestedSiteMeasurements.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Measurements to capture</h3>
                        <ul className="space-y-2">
                          {suggestedSiteMeasurements.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Contractor-ready brief</h2>
              <p className="text-sm text-slate-600">Your brief is still being assembled. Once ready, this section will help you explain the project much more clearly during contractor walk-throughs.</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3">What to do next</h2>
            <ul className="space-y-3">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-3">
              <Link
                href={`/vision/results/${project_id}/connect`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Move into contractor matching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shield/check"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Verify a contractor first
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Design concepts</h2>
                <p className="text-sm text-slate-600 mt-1">Optional inspiration to react to, not construction-ready drawings.</p>
              </div>
              {!hasAnyConcepts && (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                  <ImageIcon className="h-3.5 w-3.5" />
                  Rendering
                </div>
              )}
            </div>

            {requestedDirection && (
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Requested direction</h3>
                <p className="text-sm text-slate-700 capitalize">{requestedDirection}</p>
              </div>
            )}

            {hasAnyConcepts ? (
              <div className="grid grid-cols-1 gap-3">
                {project.generated_image_urls.map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Design concept ${index + 1}`} className="h-auto w-full object-cover transition-transform group-hover:scale-[1.01]" />
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="font-medium text-slate-800">Concept {index + 1}</span>
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        View full size
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </a>
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

          <section className="rounded-[2rem] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-200 mb-2">
              <ShieldCheck className="h-4 w-4" />
              Prybar Shield
            </div>
            <h2 className="text-lg font-bold mb-2">Use Shield before you sign, not after things feel weird.</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Check the contractor, scan the quote, and slow down anything that feels vague, rushed, or deposit-heavy.
            </p>
            <div className="space-y-2">
              <Link href="/shield/check" className="inline-flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                <span>Check a contractor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shield/scan" className="inline-flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                <span>Scan a quote or contract</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-3">
        <Disclaimer text={DISCLAIMERS.estimate} />
        <Disclaimer text="Design concepts are inspiration only and may not reflect buildable dimensions, code requirements, or final contractor scope." />
      </div>
    </div>
  );
}
