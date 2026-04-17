'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react';
import posthog from 'posthog-js';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { cn, formatCurrency, formatCurrencyRange } from '@/lib/utils';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ShareButton from '@/components/vision/ShareButton';
import MaterialsAccordion from '@/components/vision/MaterialsAccordion';
import ConceptsLoader from '@/components/vision/ConceptsLoader';
import BeforeAfterSlider from '@/components/vision/BeforeAfterSlider';
import type { Estimate, MaterialList, Project, ProjectBrief } from '@/types';

interface Props {
  projectId: string;
  project: Project;
  estimate: Estimate | null;
  materials: MaterialList | null;
  brief: ProjectBrief | null;
  categoryLabel: string;
  shareUrl: string;
  estimateAssumptions: string[];
  riskNotes: string[];
  likelyTrades: string[];
  siteQuestions: string[];
}

function qualityTierCopy(tier: Project['quality_tier']) {
  switch (tier) {
    case 'budget':
      return 'Budget finish level, focused on practical materials and faster value.';
    case 'premium':
      return 'Premium finish level, leaning into higher-end materials and detail work.';
    default:
      return 'Mid-range finish level, balancing quality materials without luxury pricing.';
  }
}

function regionSummary(multiplier?: number | null) {
  if (!multiplier || multiplier === 1) return 'Local pricing is tracking close to the national average.';
  const pct = Math.round(Math.abs(multiplier - 1) * 100);
  return multiplier > 1
    ? `Based on your ZIP code, costs in your area run about ${pct}% above the national average.`
    : `Based on your ZIP code, costs in your area run about ${pct}% below the national average.`;
}

function seasonalRecommendation(category: Project['project_category']) {
  switch (category) {
    case 'roofing':
    case 'exterior_paint':
      return 'Exterior crews book fastest heading into warm weather, so earlier planning usually gets better scheduling.';
    case 'deck_patio':
    case 'landscaping':
      return 'Outdoor projects tend to spike in spring, so locking scope early helps before calendars fill up.';
    case 'bathroom':
    case 'kitchen':
      return 'Interior renovation calendars tend to fill before holiday seasons, so now is a good time to get accurate bids.';
    default:
      return 'Getting a tight scope before contractor walk-throughs usually saves the most time and change orders.';
  }
}

function relatedProjectLabel(category: Project['project_category']) {
  switch (category) {
    case 'bathroom':
      return 'Many homeowners pairing a bathroom refresh also price tile or flooring upgrades.';
    case 'kitchen':
      return 'Kitchen planners often add lighting or flooring scope after seeing the first estimate.';
    case 'roofing':
      return 'Roof replacements often trigger gutter, fascia, or exterior paint conversations.';
    default:
      return 'Once scope is clear, the next smartest move is comparing contractor bids against the same written brief.';
  }
}

function derivePermitAllowance(estimate: Estimate) {
  return Math.round(estimate.mid_estimate * 0.05);
}

function deriveContingency(estimate: Estimate) {
  return Math.round(estimate.mid_estimate * 0.12);
}

export default function VisionResultsView({
  projectId,
  project,
  estimate,
  materials,
  brief,
  categoryLabel,
  shareUrl,
  estimateAssumptions,
  riskNotes,
  likelyTrades,
  siteQuestions,
}: Props) {
  const conceptImages = Array.isArray(project.generated_image_urls) ? project.generated_image_urls : [];
  const originalImage = project.uploaded_image_urls?.[0];
  const hasAnyConcepts = conceptImages.length > 0;
  const [selectedConcept, setSelectedConcept] = useState(0);

  const sectionCounts = useMemo(() => ({
    concepts: conceptImages.length,
    materialItems: materials?.line_items?.length || 0,
  }), [conceptImages.length, materials?.line_items?.length]);

  useEffect(() => {
    posthog.capture('naili_results_viewed', {
      project_id: projectId,
      zip_code: project.zip_code,
      project_category: project.project_category,
      quality_tier: project.quality_tier,
    });

    if (estimate) {
      posthog.capture('naili_estimate_viewed', { project_id: projectId, project_category: project.project_category });
    }
    if (materials) {
      posthog.capture('naili_materials_viewed', { project_id: projectId, item_count: materials.line_items.length });
    }
    if (brief) {
      posthog.capture('naili_brief_viewed', { project_id: projectId, project_category: project.project_category });
    }
  }, [brief, estimate, materials, project.project_category, project.quality_tier, project.zip_code, projectId]);

  useEffect(() => {
    if (!hasAnyConcepts) return;
    posthog.capture('naili_concept_image_viewed', {
      project_id: projectId,
      concept_index: selectedConcept,
      project_category: project.project_category,
    });
  }, [hasAnyConcepts, project.project_category, projectId, selectedConcept]);

  const selectedConceptUrl = conceptImages[selectedConcept] || conceptImages[0] || null;
  const laborMid = estimate?.estimate_breakdown?.labor_mid ?? (estimate ? Math.round(estimate.mid_estimate * 0.58) : 0);
  const materialsMid = estimate?.estimate_breakdown?.materials_mid ?? (estimate ? Math.round(estimate.mid_estimate * 0.3) : 0);
  const permitsMid = estimate ? derivePermitAllowance(estimate) : 0;
  const contingencyMid = estimate ? deriveContingency(estimate) : 0;
  const matchHref = `/vision/results/${projectId}/connect?zip=${encodeURIComponent(project.zip_code)}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] px-6 py-8 text-white shadow-[0_24px_90px_rgba(15,23,42,0.26)] sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="blue" className="border-white/15 bg-white/10 text-white">{project.quality_tier} tier</Badge>
              <Badge variant="gray" className="border-white/15 bg-white/10 text-white">{categoryLabel}</Badge>
              <Badge variant={estimate || materials || brief ? 'green' : 'amber'}>
                {estimate || materials || brief ? 'Plan ready' : 'Still generating'}
              </Badge>
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">naili vision</p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Nail the vision. Know the cost.</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/78 sm:text-lg">
              Your {categoryLabel.toLowerCase()} plan is built from your photo, your prompt, your finish level, and your local market. Use it to walk into every contractor conversation with more leverage.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur">
                <MapPin className="h-4 w-4" /> ZIP {project.zip_code}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur">
                <Sparkles className="h-4 w-4" /> {sectionCounts.concepts || 1} concept{(sectionCounts.concepts || 1) !== 1 ? 's' : ''}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur">
                <Wrench className="h-4 w-4" /> {sectionCounts.materialItems} material items
              </div>
            </div>
          </div>

          <div className="w-full max-w-md rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
            <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Next step</div>
              <h2 className="mt-2 text-2xl font-bold text-white">Ready to make this real?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/78">
                We&apos;ll send this brief to 2–3 vetted pros in your ZIP. No phone calls, no sales pitches until you&apos;re ready. You pick who to talk to.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href={matchHref}
                  onClick={() => posthog.capture('naili_match_cta_clicked', { project_id: projectId, placement: 'hero' })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-6 py-3 text-base font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.28)] transition-opacity hover:opacity-95"
                >
                  Match me with local pros <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <p className="text-xs text-white/65">We&apos;ll reach out within 24 hours with matches who already know the scope.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Most likely cost</div>
                <div className="mt-2 text-2xl font-bold text-[#a8eb57]">{estimate ? formatCurrency(estimate.mid_estimate) : 'Pending'}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Share-ready brief</div>
                <div className="mt-2 text-base font-semibold text-white">{brief ? 'Ready now' : 'Generating'}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="w-full border border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => window.print()}>
                  <Download className="mr-2 h-4 w-4" /> Download / print brief
                </Button>
                <Link href="/shield/check" className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/15">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Use shield
                </Link>
              </div>
              <ShareButton shareUrl={shareUrl} variant="dark" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Wallet className="h-4 w-4 text-[#1f7cf7]" /> Smart estimate</div>
          <div className="mt-3 text-lg font-semibold text-slate-900">{estimate ? formatCurrencyRange(estimate.low_estimate, estimate.high_estimate) : 'Still preparing'}</div>
          <p className="mt-2 text-sm text-slate-600">Photo-aware cost planning grounded in your finish tier and ZIP code.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><FileText className="h-4 w-4 text-[#48c7f1]" /> Contractor brief</div>
          <div className="mt-3 text-lg font-semibold text-slate-900">{brief ? 'Ready to share before quotes' : 'Still drafting'}</div>
          <p className="mt-2 text-sm text-slate-600">A cleaner walk-through summary, scope notes, and quote questions.</p>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500"><TrendingUp className="h-4 w-4 text-[#a8eb57]" /> Local context</div>
          <div className="mt-3 text-lg font-semibold text-slate-900">{regionSummary(estimate?.region_multiplier)}</div>
          <p className="mt-2 text-sm text-slate-600">{qualityTierCopy(project.quality_tier)}</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Concept images</h2>
            <p className="mt-1 text-sm text-slate-500">A visual direction grounded in the original photo, not a generic style template.</p>
          </div>
          {hasAnyConcepts && selectedConceptUrl && (
            <a href={selectedConceptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#48c7f1] hover:text-[#1f7cf7]">
              <Eye className="h-4 w-4" /> Open selected concept
            </a>
          )}
        </div>

        {hasAnyConcepts && selectedConceptUrl && originalImage ? (
          <div className="space-y-5">
            <BeforeAfterSlider beforeImage={originalImage} afterImage={selectedConceptUrl} beforeLabel="Original photo" afterLabel={`Concept ${selectedConcept + 1}`} />
            <div className="grid gap-4 md:grid-cols-3">
              {conceptImages.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedConcept(index)}
                  className={cn(
                    'overflow-hidden rounded-[1.5rem] border bg-white text-left shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(72,199,241,0.18)]',
                    selectedConcept === index ? 'border-[#1f7cf7] ring-2 ring-[#d7f4ff]' : 'border-slate-200'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Concept ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Concept {index + 1}</div>
                      <div className="text-xs text-slate-500">Same layout, new finish direction</div>
                    </div>
                    {selectedConcept === index && <CheckCircle2 className="h-5 w-5 text-[#1f7cf7]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : hasAnyConcepts ? (
          <div className="grid gap-4 md:grid-cols-3">
            {conceptImages.map((url, index) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Concept ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                <div className="px-4 py-3 text-sm font-semibold text-slate-900">Concept {index + 1}</div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#d7f4ff] bg-[#eef8ff] p-4 text-sm text-[#0d2340]">
              <ImageIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#1f7cf7]" />
              <p>Your estimate and brief are ready first. Concepts can take a bit longer, so you can keep planning while these finish in the background.</p>
            </div>
            <ConceptsLoader
              projectId={projectId}
              category={project.project_category}
              style={project.style_preference || 'modern'}
              qualityTier={project.quality_tier}
              notes={project.notes || undefined}
              referenceImageUrl={originalImage}
              hasImages={false}
            />
          </div>
        )}
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Smart cost estimate</h2>
            <p className="mt-1 text-sm text-slate-500">A planning estimate built from the visible scope, your notes, and local pricing, not a generic benchmark.</p>
          </div>
          {estimate && <Badge variant="amber" className="w-fit">{qualityTierCopy(project.quality_tier)}</Badge>}
        </div>

        {estimate ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 text-center">
                <div className="text-sm font-medium text-slate-500">Low</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(estimate.low_estimate)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.12),rgba(72,199,241,0.12))] p-5 text-center shadow-[0_12px_30px_rgba(31,124,247,0.12)]">
                <div className="text-sm font-semibold text-[#0f5fc6]">Mid, most likely</div>
                <div className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(estimate.mid_estimate)}</div>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5 text-center">
                <div className="text-sm font-medium text-slate-500">High</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(estimate.high_estimate)}</div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
                <span>{formatCurrency(estimate.low_estimate)}</span>
                <span>{formatCurrency(estimate.high_estimate)}</span>
              </div>
              <div className="relative h-4 overflow-hidden rounded-full bg-white shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#16a34a_0%,#a8eb57_50%,#1f7cf7_100%)]" />
                <div className="absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-4 border-white bg-[#48c7f1] shadow-lg" style={{ left: 'calc(50% - 16px)' }} />
              </div>
              <p className="mt-3 text-sm text-slate-600">Regional adjustment: {regionSummary(estimate.region_multiplier)}</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Labor</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(laborMid)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Materials</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(materialsMid)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Permits / fees</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(permitsMid)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contingency</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(contingencyMid)}</div>
              </div>
            </div>

            <details className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">What affects your final cost</summary>
              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Assumptions</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {estimateAssumptions.map((item, index) => (
                      <li key={index} className="flex gap-2"><span className="text-[#48c7f1]">•</span><span>{item}</span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Risk notes</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {riskNotes.map((item, index) => (
                      <li key={index} className="flex gap-2"><span>⚠️</span><span>{item}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              {estimate.estimate_basis && <p className="mt-4 text-sm text-slate-600">Estimate basis: {estimate.estimate_basis}</p>}
            </details>
            <Disclaimer text={DISCLAIMERS.estimate} className="mt-5" />
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Your estimate is still generating. This section usually fills in shortly after the core project plan lands.</div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Materials list</h2>
            <p className="mt-1 text-sm text-slate-500">Specific line items to keep allowances, bids, and shopping conversations grounded.</p>
          </div>
          {materials && <Badge variant="blue">{materials.line_items.length} line items</Badge>}
        </div>
        {materials ? (
          <MaterialsAccordion materials={materials} />
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">Your materials list is still being prepared. The estimate and contractor brief are ready to use in the meantime.</div>
        )}
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Contractor-ready brief</h2>
            <p className="mt-1 text-sm text-slate-500">Share this with any contractor before they quote you.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="border-0 bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] shadow-[0_14px_40px_rgba(31,124,247,0.28)] hover:opacity-95" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Download as PDF
            </Button>
            <ShareButton shareUrl={shareUrl} variant="light" />
          </div>
        </div>

        {brief ? (
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</div>
                <p className="mt-3 text-base leading-relaxed text-slate-800">{brief.summary}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Homeowner goals</div>
                <p className="mt-3 text-base leading-relaxed text-slate-800">{brief.homeowner_goals}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Walk-through notes</div>
                <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{brief.contractor_notes}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Likely trades</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {likelyTrades.length > 0 ? likelyTrades.map((trade, index) => (
                    <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{trade}</span>
                  )) : <span className="text-sm text-slate-500">Still inferring likely trades.</span>}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Questions for the walk-through</div>
                <ul className="mt-3 space-y-3">
                  {siteQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#eef8ff] font-semibold text-[#48c7f1]">{index + 1}</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Your brief is still being assembled. Once it lands, this section becomes the easiest thing to hand to a contractor before they quote.</div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Smart recommendations</h2>
          <p className="mt-1 text-sm text-slate-500">The next best moves to keep this project controlled before any deposit is paid.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <ShieldCheck className="h-5 w-5 text-[#48c7f1]" />
            <h3 className="mt-3 font-semibold text-slate-900">Before you hire</h3>
            <p className="mt-2 text-sm text-slate-600">Run a shield check before you sign anything, especially if the quote or payment schedule feels rushed.</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <Wrench className="h-5 w-5 text-[#1f7cf7]" />
            <h3 className="mt-3 font-semibold text-slate-900">Homeowners also add</h3>
            <p className="mt-2 text-sm text-slate-600">{relatedProjectLabel(project.project_category)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <CalendarClock className="h-5 w-5 text-[#a8eb57]" />
            <h3 className="mt-3 font-semibold text-slate-900">Best time to book</h3>
            <p className="mt-2 text-sm text-slate-600">{seasonalRecommendation(project.project_category)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <TrendingUp className="h-5 w-5 text-[#6db93c]" />
            <h3 className="mt-3 font-semibold text-slate-900">Trending in your area</h3>
            <p className="mt-2 text-sm text-slate-600">Projects with clear scope and a shareable brief usually get cleaner, faster bid comparisons.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Ready to make this real?</p>
            <h2 className="mt-2 text-3xl font-bold">Get matched with 2–3 local pros who can quote from the brief.</h2>
            <p className="mt-3 max-w-2xl text-white/75">This is the fastest way to turn your estimate, materials list, and contractor-ready brief into real bids without starting from scratch on every call.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={matchHref}
              onClick={() => posthog.capture('naili_match_cta_clicked', { project_id: projectId, placement: 'footer' })}
              className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-6 py-3 text-base font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.28)] transition-opacity hover:opacity-95"
            >
              Match me with local pros <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/shield/check" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/15">
              Verify a contractor first
            </Link>
          </div>
        </div>
      </section>

      <Disclaimer text="Design concepts are optional inspiration only and may not reflect final buildable dimensions, code requirements, or contractor scope." className="mt-8" />
    </div>
  );
}
