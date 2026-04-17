import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText } from 'lucide-react';
import { COST_GUIDES } from '@/lib/costGuides';

export const metadata: Metadata = {
  title: 'Cost guides',
  description: 'Real cost guides for common home projects, plus a faster path to a custom brief and estimate when you want numbers for your exact space.',
  alternates: {
    canonical: 'https://www.naili.ai/cost-guides',
  },
};

export default function CostGuidesIndexPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">naili cost guides</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Real project cost guides, then a custom estimate when you want one.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">
            Start with the broad ranges, then upload your own space when you want a tighter brief, estimate, and contractor handoff.
          </p>
          <div className="mt-8">
            <Link href="/vision/start" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d2340] transition-colors hover:bg-slate-100">
              Start my project <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {COST_GUIDES.map((guide) => (
              <Link key={guide.slug} href={`/cost-guides/${guide.slug}`} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(72,199,241,0.14)]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#48c7f1]">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[#0d0d1a]">{guide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{guide.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1f7cf7]">
                  Read guide <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
