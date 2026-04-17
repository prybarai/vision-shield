import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Lock, PaintRoller, Sparkles } from 'lucide-react';

const TRADES = [
  {
    slug: 'interior-paint',
    title: 'Interior painting',
    status: 'live',
    desc: 'The proof-phase estimator walkthrough. Session-driven, mobile-first, and shaped for contractor-style interior painting scope.',
    points: ['Guided room walkthrough', 'Perimeter measurement capture', 'Prep-level and ceiling-scope checks'],
  },
  {
    slug: '',
    title: 'Exterior painting',
    status: 'private_beta',
    desc: 'Queued for the next bounded-scope launch once interior painting calibrates cleanly.',
    points: ['Elevation capture', 'Trim and prep complexity', 'Access and story-count adjustments'],
  },
  {
    slug: '',
    title: 'Flooring',
    status: 'private_beta',
    desc: 'Planned after painting in the rebuild sequence, once measurement and quantity flows harden.',
    points: ['Room-by-room surface counts', 'Subfloor condition prompts', 'Material-tier branching'],
  },
];

export const metadata: Metadata = {
  title: 'estimate | naili',
  description: 'Choose the trade you want priced and start the new naili estimator flow.',
};

export default function EstimateIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_72%,#48c7f1_100%)] px-6 py-10 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:px-8 sm:py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              <Sparkles className="h-4 w-4 text-[#a8eb57]" /> estimator rebuild
            </div>
            <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Pick the trade you want priced.</h1>
            <p className="mt-4 text-lg leading-relaxed text-white/78">
              Naili is moving from a generic planner into a trade-by-trade virtual estimator. We are launching in the same order the spec calls for, starting with interior painting.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {TRADES.map((trade) => (
            <div key={trade.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#1f7cf7]">
                  <PaintRoller className="h-6 w-6" />
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${trade.status === 'live' ? 'bg-[#f4fde8] text-[#4f8a24]' : 'bg-slate-100 text-slate-500'}`}>
                  {trade.status === 'live' ? 'live beta' : 'private beta'}
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-bold text-slate-900">{trade.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{trade.desc}</p>
              <ul className="mt-5 space-y-3 text-sm text-slate-700">
                {trade.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {trade.status === 'live' ? (
                  <Link href={`/estimate/${trade.slug}`} className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(31,124,247,0.22)] transition-opacity hover:opacity-95">
                    Start this estimate <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-500">
                    <Lock className="h-4 w-4" /> Coming after painting calibration
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
