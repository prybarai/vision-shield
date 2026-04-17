import type { Estimate, MaterialList, Project, ProjectBrief } from '@/types';
import { formatCurrency, formatCurrencyRange, cn } from '@/lib/utils';

interface Props {
  project: Project;
  categoryLabel: string;
  estimate: Estimate | null;
  materials: MaterialList | null;
  brief: ProjectBrief | null;
  likelyTrades?: string[];
  siteQuestions?: string[];
  className?: string;
  title?: string;
  subtitle?: string;
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export default function ProjectBriefDocument({
  project,
  categoryLabel,
  estimate,
  materials,
  brief,
  likelyTrades,
  siteQuestions,
  className,
  title = 'Project handoff brief',
  subtitle = 'A cleaner planning packet to compare bids and walk a contractor through the same scope.',
}: Props) {
  const displayTrades = likelyTrades?.length ? likelyTrades : brief?.likely_trades || [];
  const displayQuestions = siteQuestions?.length ? siteQuestions : brief?.site_verification_questions || [];
  const displayUnknowns = brief?.unknowns_to_verify || [];
  const displayMeasurements = brief?.suggested_site_measurements || [];
  const materialPreview = materials?.line_items?.slice(0, 8) || [];
  const documentDate = formatDate(brief?.created_at || estimate?.created_at || project.updated_at || project.created_at);

  return (
    <article className={cn('project-brief-document rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-8', className)}>
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f7cf7]">naili vision</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-600 sm:min-w-[220px]">
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-900">Project:</span> {categoryLabel}</div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-900">Finish tier:</span> {project.quality_tier}</div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-900">ZIP:</span> {project.zip_code}</div>
          {documentDate && <div className="rounded-2xl bg-slate-50 px-4 py-3"><span className="font-semibold text-slate-900">Prepared:</span> {documentDate}</div>}
        </div>
      </div>

      {estimate && (
        <section className="brief-page-break-inside-avoid mt-6 rounded-[1.75rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.08),rgba(72,199,241,0.08))] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5fc6]">Planning range</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">{formatCurrencyRange(estimate.low_estimate, estimate.high_estimate)}</h3>
              <p className="mt-2 text-sm text-slate-600">Most likely outcome: {formatCurrency(estimate.mid_estimate)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl bg-white px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Low</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(estimate.low_estimate)}</div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center ring-2 ring-[#d7f4ff]">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#0f5fc6]">Mid</div>
                <div className="mt-2 text-xl font-bold text-slate-950">{formatCurrency(estimate.mid_estimate)}</div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-center">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">High</div>
                <div className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(estimate.high_estimate)}</div>
              </div>
            </div>
          </div>
          {estimate.estimate_basis && <p className="mt-4 text-sm leading-relaxed text-slate-600">{estimate.estimate_basis}</p>}
        </section>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className="brief-page-break-inside-avoid rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Project summary</p>
            <p className="mt-3 text-base leading-relaxed text-slate-800">{brief?.summary || 'The estimate is ready. The written project summary is still finishing in the background.'}</p>
          </section>

          <section className="brief-page-break-inside-avoid rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Homeowner goals</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{brief?.homeowner_goals || project.notes || 'No extra homeowner notes were added yet.'}</p>
          </section>

          <section className="brief-page-break-inside-avoid rounded-[1.5rem] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Walk-through notes</p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-800">{brief?.contractor_notes || 'Use the original photo, concept direction, and estimate assumptions to confirm final scope onsite.'}</p>
          </section>

          {materialPreview.length > 0 && (
            <section className="brief-page-break-inside-avoid rounded-[1.5rem] border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Materials snapshot</p>
                <span className="text-sm text-slate-500">{materials?.line_items.length} item{materials?.line_items.length === 1 ? '' : 's'}</span>
              </div>
              <div className="mt-4 space-y-3">
                {materialPreview.map((item, index) => (
                  <div key={`${item.item}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.item}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500">{item.category} • {item.finish_tier}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">{formatCurrencyRange(item.estimated_cost_low, item.estimated_cost_high)}</div>
                    </div>
                    {item.sourcing_notes && <p className="mt-2 text-sm text-slate-600">{item.sourcing_notes}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="brief-page-break-inside-avoid rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Likely trades</p>
            {displayTrades.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {displayTrades.map((trade, index) => (
                  <span key={`${trade}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{trade}</span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Likely trades are still being inferred from the project scope.</p>
            )}
          </section>

          <section className="brief-page-break-inside-avoid rounded-[1.5rem] border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Questions for the walk-through</p>
            {displayQuestions.length > 0 ? (
              <ol className="mt-3 space-y-3">
                {displayQuestions.map((question, index) => (
                  <li key={`${question}-${index}`} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#eef8ff] font-semibold text-[#1f7cf7]">{index + 1}</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Walk-through questions are still being assembled.</p>
            )}
          </section>

          {displayUnknowns.length > 0 && (
            <section className="brief-page-break-inside-avoid rounded-[1.5rem] border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unknowns to verify onsite</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {displayUnknowns.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2"><span className="text-[#48c7f1]">•</span><span>{item}</span></li>
                ))}
              </ul>
            </section>
          )}

          {displayMeasurements.length > 0 && (
            <section className="brief-page-break-inside-avoid rounded-[1.5rem] border border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Measurements to confirm</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {displayMeasurements.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2"><span className="text-[#48c7f1]">•</span><span>{item}</span></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}
