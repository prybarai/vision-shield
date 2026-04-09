import Link from 'next/link';
import { ArrowRight, Camera, DollarSign, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { PROJECT_CATEGORIES } from '@/types';

const FEATURES = [
  {
    icon: DollarSign,
    title: 'Rough budget range',
    desc: 'Get a planning-grade estimate shaped by your uploaded photo, ZIP code, project type, and finish level.',
  },
  {
    icon: FileText,
    title: 'Materials + contractor brief',
    desc: 'Walk into quote conversations with cleaner scope notes, materials guidance, and practical follow-up questions.',
  },
  {
    icon: Sparkles,
    title: 'Optional concept inspiration',
    desc: 'See visual directions for the space while keeping the estimate and planning outputs front and center.',
  },
];

export default function VisionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.18),transparent_35%),linear-gradient(135deg,#eff6ff_0%,#ffffff_55%,#f8fafc_100%)] border border-blue-100 px-5 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14 mb-10 sm:mb-14">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-5">
            <Sparkles className="h-4 w-4" />
            Prybar Vision
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-balance">
            Turn one photo into a clearer renovation plan.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-7 leading-relaxed">
            Upload your space, answer a few smart scope questions, and get a rough estimate, materials plan, contractor-ready brief, and optional design concepts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
            <Link
              href="/vision/start"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
            >
              <Camera className="h-5 w-5" />
              Upload a photo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shield"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
              See Shield first
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

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Project types you can start today</h2>
            <p className="text-slate-600">Use a guided category or choose the custom path if your project is more specific.</p>
          </div>
          <p className="text-sm text-slate-500">Planning outputs arrive first, concepts can continue loading in the background.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(PROJECT_CATEGORIES).map(([key, cat]) => (
            <Link
              key={key}
              href="/vision/start"
              className="group bg-white rounded-3xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="text-3xl mb-3">{cat.emoji}</div>
              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">{cat.label}</div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{cat.description}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
