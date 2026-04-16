import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Camera, DollarSign, FileText, ShieldCheck, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: DollarSign,
    title: 'What this should cost',
    desc: 'Get a planning-grade estimate shaped by your uploaded photo, ZIP code, project type, and finish level.',
  },
  {
    icon: FileText,
    title: 'Your contractor-ready brief',
    desc: 'Walk into quote conversations with cleaner scope notes, materials guidance, and practical follow-up questions.',
  },
  {
    icon: Sparkles,
    title: 'AI concept inspiration',
    desc: 'See visual directions for the space while keeping the estimate and planning outputs front and center.',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_35%),linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] border border-blue-100 px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14 mb-10 sm:mb-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-5">
            <Sparkles className="h-4 w-4" />
            naili vision
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-balance">
            See the project before it starts.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-7 leading-relaxed">
            Show naili your space, answer a few smart scope questions, and get concept images, a real cost range, a materials plan, and a contractor-ready brief.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
            <Link
              href="/vision/start"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
            >
              <Camera className="h-5 w-5" />
              Nail my project
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shield"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
              See naili shield
            </Link>
          </div>
          <p className="text-sm text-slate-500">Free to start, private by default, no contractor outreach until you decide.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 sm:mb-16">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <feature.icon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="font-semibold text-slate-900 text-lg mb-2">{feature.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
