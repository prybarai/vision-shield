import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Camera, DollarSign, FileText, ShieldCheck, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Photo-aware concept direction',
    desc: 'naili reads the actual photo and your request before it generates inspiration, instead of relying on category defaults alone.',
  },
  {
    icon: DollarSign,
    title: 'Smart cost range',
    desc: 'Get low, mid, and high planning ranges shaped by visible condition, likely scope, ZIP code, and finish tier.',
  },
  {
    icon: FileText,
    title: 'Contractor-ready brief',
    desc: 'Walk into quote conversations with scope notes, material direction, and better questions already in hand.',
  },
];

export const metadata: Metadata = {
  title: 'naili vision',
  description:
    'Upload a photo, see what your project could look like, and get a planning-grade estimate before talking to a contractor.',
  alternates: {
    canonical: 'https://naili.ai/vision',
  },
  openGraph: {
    title: 'naili vision',
    description: 'See the project before it starts.',
    url: 'https://naili.ai/vision',
    images: ['/og-naili.png'],
  },
};

export default function VisionPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] px-6 py-10 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)] sm:px-8 sm:py-12 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.16),transparent_24%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 mb-5">
            <Sparkles className="h-4 w-4 text-[#a8eb57]" />
            naili vision
          </div>
          <h1 className="text-4xl font-bold text-balance md:text-5xl">See the project before it starts.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/76">
            Upload a photo of your space, describe what you want to change, and get concepts, a real cost range, a materials plan, and a contractor-ready brief before you talk to anyone.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62">
            Rebuild note: the new estimator is launching trade by trade. Interior painting is the active proof-phase walkthrough right now.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/estimate"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.28)] transition-opacity hover:opacity-95"
            >
              <Camera className="h-5 w-5" />
              Start an estimate
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shield"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <ShieldCheck className="h-5 w-5" />
              See naili shield
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/60">Free to start, private by default, no contractor outreach until you choose.</p>
        </div>
      </section>

      <section className="grid gap-5 py-12 md:grid-cols-3 sm:py-14">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#48c7f1] mb-4">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-[#0d0d1a]">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
