'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  PenSquare,
  ShoppingCart,
  Sparkles,
  Wallet,
  Wrench,
} from 'lucide-react';
import posthog from 'posthog-js';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { cn, formatCurrency, formatCurrencyRange } from '@/lib/utils';
import Disclaimer from '@/components/ui/Disclaimer';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/vision/ShareButton';
import MaterialsAccordion from '@/components/vision/MaterialsAccordion';
import ConceptsLoader from '@/components/vision/ConceptsLoader';
import BeforeAfterSlider from '@/components/vision/BeforeAfterSlider';
import ProjectBriefDocument from '@/components/vision/ProjectBriefDocument';
import { RefreshCw } from 'lucide-react';
import type { Estimate, MaterialList, Project, ProjectBrief } from '@/types';

/* ─── Props ─── */

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

/* ─── Helpers ─── */

function tierLabel(tier: Project['quality_tier']) {
  switch (tier) {
    case 'budget': return 'Budget';
    case 'premium': return 'Premium';
    default: return 'Mid-range';
  }
}

function regionNote(multiplier?: number | null) {
  if (!multiplier || multiplier === 1) return 'Near national average';
  const pct = Math.round(Math.abs(multiplier - 1) * 100);
  return multiplier > 1 ? `${pct}% above avg` : `${pct}% below avg`;
}

/* ─── Section Nav ─── */

type SectionId = 'concepts' | 'estimate' | 'materials' | 'brief' | 'next';

const SECTION_TABS: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
  { id: 'concepts', label: 'Concepts', icon: <ImageIcon className="h-4 w-4" /> },
  { id: 'estimate', label: 'Estimate', icon: <Wallet className="h-4 w-4" /> },
  { id: 'materials', label: 'Materials', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'brief', label: 'Brief', icon: <FileText className="h-4 w-4" /> },
  { id: 'next', label: 'Next Steps', icon: <ArrowRight className="h-4 w-4" /> },
];

/* ─── Donut Chart ─── */

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  let cumulative = 0;
  const size = 160;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0 -rotate-90">
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashArray = `${pct * circumference} ${circumference}`;
          const dashOffset = -(cumulative / total) * circumference;
          cumulative += seg.value;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-ink-600">{seg.label}</span>
            <span className="ml-auto font-semibold text-ink">{formatCurrency(seg.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function VisionResultsView({
  projectId,
  project,
  estimate: initialEstimate,
  materials: initialMaterials,
  brief: initialBrief,
  categoryLabel,
  shareUrl,
  estimateAssumptions,
  riskNotes,
  likelyTrades,
  siteQuestions,
}: Props) {
  const router = useRouter();

  /* ─── Polling for missing data ─── */
  const [estimate, setEstimate] = useState(initialEstimate);
  const [materials, setMaterials] = useState(initialMaterials);
  const [brief, setBrief] = useState(initialBrief);
  const [conceptImages, setConceptImages] = useState<string[]>(
    Array.isArray(project.generated_image_urls) ? project.generated_image_urls : []
  );
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const needsPolling = !estimate || !materials || !brief || conceptImages.length === 0;

  const pollForData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/get?id=${projectId}`);
      if (!res.ok) return;
      const { project: updatedProject } = await res.json() as { project: Project };
      const newConcepts = Array.isArray(updatedProject.generated_image_urls)
        ? updatedProject.generated_image_urls
        : [];
      if (newConcepts.length > conceptImages.length) {
        setConceptImages(newConcepts);
      }
    } catch { /* silent */ }
    router.refresh();
    setPollCount((c) => c + 1);
  }, [conceptImages.length, projectId, router]);

  useEffect(() => {
    if (!needsPolling || pollCount >= 20) return;
    const delay = pollCount < 4 ? 8000 : pollCount < 10 ? 15000 : 30000;
    pollTimerRef.current = setTimeout(pollForData, delay);
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, [needsPolling, pollCount, pollForData]);

  useEffect(() => {
    if (initialEstimate && !estimate) setEstimate(initialEstimate);
    if (initialMaterials && !materials) setMaterials(initialMaterials);
    if (initialBrief && !brief) setBrief(initialBrief);
  }, [initialEstimate, initialMaterials, initialBrief, estimate, materials, brief]);

  /* ─── State ─── */
  const originalImage = project.uploaded_image_urls?.[0];
  const hasAnyConcepts = conceptImages.length > 0;
  const [selectedConcept, setSelectedConcept] = useState(0);
  const [activeSection, setActiveSection] = useState<SectionId>('concepts');
  const [stickyVisible, setStickyVisible] = useState(false);

  /* ─── Scroll spy ─── */
  useEffect(() => {
    const handleScroll = () => {
      setStickyVisible(window.scrollY > 400);
      const sections: SectionId[] = ['concepts', 'estimate', 'materials', 'brief', 'next'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${sections[i]}`);
        if (el && el.offsetTop - 120 <= window.scrollY) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: SectionId) => {
    const el = document.getElementById(`section-${id}`);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
  };

  /* ─── Analytics ─── */
  useEffect(() => {
    posthog.capture('naili_results_viewed', {
      project_id: projectId,
      zip_code: project.zip_code,
      project_category: project.project_category,
      quality_tier: project.quality_tier,
    });
  }, [project.project_category, project.quality_tier, project.zip_code, projectId]);

  /* ─── Derived ─── */
  const selectedConceptUrl = conceptImages[selectedConcept] || conceptImages[0] || null;
  const laborMid = estimate?.estimate_breakdown?.labor_mid ?? (estimate ? Math.round(estimate.mid_estimate * 0.58) : 0);
  const materialsMid = estimate?.estimate_breakdown?.materials_mid ?? (estimate ? Math.round(estimate.mid_estimate * 0.3) : 0);
  const permitsMid = estimate ? Math.round(estimate.mid_estimate * 0.05) : 0;
  const contingencyMid = estimate ? Math.round(estimate.mid_estimate * 0.12) : 0;
  const matchHref = `/get-quotes?project=${encodeURIComponent(projectId)}&zip=${encodeURIComponent(project.zip_code)}&category=${encodeURIComponent(project.project_category)}&estimate=${encodeURIComponent(String(estimate?.mid_estimate || ''))}`;
  const reviseHref = `/vision/start?${new URLSearchParams({
    from: projectId,
    category: project.project_category,
    zip: project.zip_code,
    style: project.style_preference || 'modern',
    quality: project.quality_tier,
    notes: project.notes || '',
    image: originalImage || '',
  }).toString()}`;

  /* ─── Regenerate materials ─── */
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const handleRegenerateMaterials = async () => {
    setIsRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch('/api/vision/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category: project.project_category,
          style: project.style_preference || 'modern',
          quality_tier: project.quality_tier,
          estimate_mid: estimate?.mid_estimate || 20000,
          generated_image_url: conceptImages[0] || undefined,
          analysis: (project as any).analysis || undefined,
          notes: project.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to regenerate');
      const { materials: newMaterials } = await res.json();
      setMaterials(newMaterials);
      posthog.capture('naili_materials_regenerated', { project_id: projectId });
    } catch (err) {
      setRegenError('Could not refresh materials. Please try again.');
      console.error('Regenerate materials error:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const readySections = [estimate, materials, brief, hasAnyConcepts ? true : null].filter(Boolean);
  const readyCount = readySections.length;
  const totalSections = 4;

  const donutSegments = estimate ? [
    { label: 'Labor', value: laborMid, color: '#D8B98A' },
    { label: 'Materials', value: materialsMid, color: '#B8D8C8' },
    { label: 'Permits', value: permitsMid, color: '#93C5FD' },
    { label: 'Contingency', value: contingencyMid, color: '#E5E7EB' },
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

      {/* ─── Sticky Section Nav ─── */}
      <div
        className={cn(
          'fixed left-0 right-0 top-0 z-50 border-b border-hairline bg-canvas/95 backdrop-blur-lg transition-all duration-300 print:hidden',
          stickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:gap-2 sm:px-6">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToSection(tab.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm',
                activeSection === tab.id
                  ? 'bg-ink text-canvas-50'
                  : 'text-ink-500 hover:bg-canvas-200 hover:text-ink'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={readyCount === totalSections ? 'green' : 'amber'} className="text-[10px]">
              {readyCount}/{totalSections} ready
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Hero — Compact, visual, with original photo ─── */}
      <section className="relative overflow-hidden rounded-[2rem] print:hidden">
        {/* Background with original photo */}
        <div className="relative">
          {originalImage && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1b1d22]/95 via-[#1b1d22]/85 to-[#1b1d22]/70" />
            </div>
          )}
          {!originalImage && (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b1d22_0%,#242831_46%,#1b1d22_100%)]" />
          )}

          <div className="relative px-6 py-8 text-white sm:px-10 sm:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              {/* Left — Key info */}
              <div className="max-w-xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="green" className="border-white/15 bg-white/15 text-white">{tierLabel(project.quality_tier)}</Badge>
                  <Badge variant="gray" className="border-white/15 bg-white/15 text-white">{categoryLabel}</Badge>
                  <span className="flex items-center gap-1.5 text-xs text-white/60">
                    <MapPin className="h-3 w-3" /> ZIP {project.zip_code}
                  </span>
                </div>

                <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  Your {categoryLabel.toLowerCase()} plan
                </h1>

                {estimate && (
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-sand-light sm:text-5xl">{formatCurrency(estimate.mid_estimate)}</span>
                    <span className="text-sm text-white/60">estimated &middot; {regionNote(estimate.region_multiplier)}</span>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-2">
                  <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink shadow-lg transition-all hover:shadow-xl">
                    <Download className="h-4 w-4" /> Print / PDF
                  </button>
                  <div className="w-48">
                    <ShareButton shareUrl={shareUrl} variant="dark" projectTitle={`${categoryLabel} plan`} />
                  </div>
                  <Link
                    href={reviseHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <PenSquare className="h-4 w-4" /> Revise
                  </Link>
                </div>
              </div>

              {/* Right — Quick stats */}
              <div className="grid grid-cols-2 gap-3 lg:w-72">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <ImageIcon className="mb-1 h-4 w-4 text-white/50" />
                  <div className="text-2xl font-bold">{conceptImages.length}</div>
                  <div className="text-xs text-white/60">Concepts{!hasAnyConcepts && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <ShoppingCart className="mb-1 h-4 w-4 text-white/50" />
                  <div className="text-2xl font-bold">{materials?.line_items?.length || '—'}</div>
                  <div className="text-xs text-white/60">Materials</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <FileText className="mb-1 h-4 w-4 text-white/50" />
                  <div className="text-lg font-bold">{brief ? 'Ready' : '...'}</div>
                  <div className="text-xs text-white/60">Brief</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <Sparkles className="mb-1 h-4 w-4 text-white/50" />
                  <div className="text-lg font-bold">{readyCount}/{totalSections}</div>
                  <div className="text-xs text-white/60">Sections ready</div>
                </div>
              </div>
            </div>

            {readyCount < totalSections && (
              <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Some sections are still generating. This page updates automatically.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Section: Concept Images ─── */}
      <section id="section-concepts" className="mt-10 scroll-mt-24 print:hidden">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">Design concepts</h2>
            <p className="mt-1 text-sm text-ink-500">AI-generated visuals based on your photo and style preferences.</p>
          </div>
          {originalImage && (
            <ConceptsLoader
              projectId={projectId}
              category={project.project_category}
              style={project.style_preference || 'modern'}
              qualityTier={project.quality_tier}
              notes={project.notes || undefined}
              referenceImageUrl={originalImage}
              hasImages={hasAnyConcepts}
              mode="manual"
              buttonLabel="+ New concept"
            />
          )}
        </div>

        {hasAnyConcepts && selectedConceptUrl && originalImage ? (
          <div className="space-y-5">
            <BeforeAfterSlider beforeImage={originalImage} afterImage={selectedConceptUrl} beforeLabel="Your photo" afterLabel={`Concept ${selectedConcept + 1}`} />
            {conceptImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {conceptImages.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedConcept(index)}
                    className={cn(
                      'flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all',
                      selectedConcept === index ? 'border-sand-dark shadow-lg scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Concept ${index + 1}`} className="h-20 w-28 object-cover sm:h-24 sm:w-36" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : hasAnyConcepts ? (
          <div className="grid gap-4 md:grid-cols-2">
            {conceptImages.map((url, index) => (
              <div key={url} className="overflow-hidden rounded-[1.5rem] border border-hairline shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Concept ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-canvas-50 p-6 shadow-soft">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-sand/20">
              <Loader2 className="h-6 w-6 animate-spin text-sand-dark" />
            </div>
            <div>
              <p className="font-semibold text-ink">Generating your design concepts...</p>
              <p className="mt-1 text-sm text-ink-500">Usually takes 30–60 seconds. This page updates automatically.</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section: Cost Estimate ─── */}
      <section id="section-estimate" className="mt-10 scroll-mt-24 print:hidden">
        <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">Cost estimate</h2>
        <p className="mt-1 text-sm text-ink-500">Based on your photo, finish tier, and ZIP code.</p>

        {estimate ? (
          <div className="mt-5 space-y-5">
            {/* Range bar */}
            <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between text-sm text-ink-500">
                <span>Low</span>
                <span className="text-base font-bold text-ink">Most likely</span>
                <span>High</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-bold text-ink-600">{formatCurrency(estimate.low_estimate)}</span>
                <span className="text-3xl font-bold text-ink">{formatCurrency(estimate.mid_estimate)}</span>
                <span className="text-xl font-bold text-ink-600">{formatCurrency(estimate.high_estimate)}</span>
              </div>
              <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-canvas-200">
                <div className="absolute inset-0 bg-gradient-to-r from-sand/60 via-sand-dark to-mint/60" />
                <div className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink shadow-lg" style={{ left: 'calc(50% - 12px)' }} />
              </div>
              <div className="mt-3 text-center text-xs text-ink-500">{regionNote(estimate.region_multiplier)}</div>
            </div>

            {/* Donut + breakdown */}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">Cost breakdown</h3>
                <DonutChart segments={donutSegments} />
              </div>
              <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">What affects your cost</h3>
                <div className="space-y-3 text-sm text-ink-600">
                  {estimateAssumptions.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-mint" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {riskNotes.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <CalendarClock className="mt-0.5 h-4 w-4 flex-shrink-0 text-sand-dark" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                {estimate.estimate_basis && (
                  <p className="mt-4 rounded-xl bg-canvas-50 p-3 text-xs text-ink-500">{estimate.estimate_basis}</p>
                )}
              </div>
            </div>

            <Disclaimer text={DISCLAIMERS.estimate} />
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-canvas-50 p-6 shadow-soft">
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-sand-dark" />
            <div>
              <p className="font-semibold text-ink">Calculating your estimate...</p>
              <p className="mt-1 text-sm text-ink-500">This page updates automatically.</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section: Materials ─── */}
      <section id="section-materials" className="mt-10 scroll-mt-24 print:hidden">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">Materials &amp; shopping list</h2>
            <p className="mt-1 text-sm text-ink-500">Real products with prices and links. Ready to shop or hand to a contractor.</p>
          </div>
          <div className="flex items-center gap-2">
            {materials && (
              <Badge variant="green">{materials.line_items.length} items</Badge>
            )}
            {materials && (
              <button
                type="button"
                onClick={handleRegenerateMaterials}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-soft transition-all hover:bg-canvas-50 hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRegenerating && 'animate-spin')} />
                {isRegenerating ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>
        {regenError && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{regenError}</div>
        )}
        {materials ? (
          <MaterialsAccordion materials={materials} />
        ) : (
          <div className="flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-canvas-50 p-6 shadow-soft">
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-sand-dark" />
            <div>
              <p className="font-semibold text-ink">Building your materials list...</p>
              <p className="mt-1 text-sm text-ink-500">Real products with prices will appear here automatically.</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section: Brief ─── */}
      <section id="section-brief" className="mt-10 scroll-mt-24">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-ink print:hidden sm:text-3xl">Contractor handoff brief</h2>
            <p className="mt-1 text-sm text-ink-500 print:hidden">Print or share this with your contractor for accurate quotes.</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90">
              <Download className="h-4 w-4" /> Print
            </button>
            <div className="w-44">
              <ShareButton shareUrl={shareUrl} variant="light" projectTitle={`${categoryLabel} brief`} />
            </div>
          </div>
        </div>

        {brief ? (
          <ProjectBriefDocument
            project={project}
            categoryLabel={categoryLabel}
            estimate={estimate}
            materials={materials}
            brief={brief}
            likelyTrades={likelyTrades}
            siteQuestions={siteQuestions}
            subtitle="Share this with your contractor for accurate, comparable quotes."
          />
        ) : (
          <div className="flex items-center gap-4 rounded-[1.5rem] border border-hairline bg-canvas-50 p-6 shadow-soft print:hidden">
            <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-sand-dark" />
            <div>
              <p className="font-semibold text-ink">Writing your contractor brief...</p>
              <p className="mt-1 text-sm text-ink-500">This will appear automatically when ready.</p>
            </div>
          </div>
        )}
      </section>

      {/* ─── Section: Next Steps ─── */}
      <section id="section-next" className="mt-10 scroll-mt-24 print:hidden">
        <h2 className="font-display text-2xl tracking-tight text-ink sm:text-3xl">What to do next</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sand/15">
              <ShoppingCart className="h-5 w-5 text-sand-dark" />
            </div>
            <h3 className="font-semibold text-ink">Shop materials yourself</h3>
            <p className="mt-2 text-sm text-ink-600">Use the materials list above to order everything you need. Each item has a direct link to buy.</p>
          </div>
          <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-mint/15">
              <Wrench className="h-5 w-5 text-[#5BA88C]" />
            </div>
            <h3 className="font-semibold text-ink">Send to a contractor</h3>
            <p className="mt-2 text-sm text-ink-600">Share the handoff brief above for accurate, comparable quotes. The scope is already written.</p>
          </div>
          <div className="rounded-[1.5rem] border border-hairline bg-white p-6 shadow-soft transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#93C5FD]/15">
              <Eye className="h-5 w-5 text-[#2563EB]" />
            </div>
            <h3 className="font-semibold text-ink">Get a second opinion</h3>
            <p className="mt-2 text-sm text-ink-600">Share this plan with your spouse, partner, or a friend. They can see everything you see.</p>
          </div>
        </div>
      </section>

      {/* ─── CTA Footer ─── */}
      <section className="mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-r from-sand-dark to-sand p-8 text-white shadow-lg print:hidden sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to get started?</h2>
            <p className="mt-2 text-white/80">Upload another photo or find a contractor in your area.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-ink shadow-lg transition-all hover:shadow-xl"
            >
              New project <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={matchHref}
              onClick={() => posthog.capture('naili_match_cta_clicked', { project_id: projectId, placement: 'footer' })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Find a contractor
            </Link>
          </div>
        </div>
      </section>

      <Disclaimer text="Design concepts are AI-generated inspiration. Final costs depend on contractor quotes, site conditions, and material availability." className="mt-8 print:hidden" />
    </div>
  );
}
