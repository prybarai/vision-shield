import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { PROJECT_CATEGORIES } from '@/types';

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload one clear photo',
    desc: 'Start with the space you want to change. Prybar reads the photo, your ZIP code, and your project choices.',
  },
  {
    step: '02',
    icon: Wand2,
    title: 'Set scope, style, and finish level',
    desc: 'Choose the project type, answer a few smart scope questions, and pick the quality tier that matches your budget.',
  },
  {
    step: '03',
    icon: FileText,
    title: 'Get planning outputs you can actually use',
    desc: 'See a rough budget range, materials plan, contractor brief, and optional concepts without waiting for sales calls.',
  },
];

const TRUST_POINTS = [
  'Free to start',
  'Private by default',
  'No contractor calls until you ask',
];

const SHIELD_TOOLS = [
  {
    href: '/shield/check',
    title: 'Check a contractor',
    desc: 'Verify license status and get a plain-English risk read before you send a deposit.',
  },
  {
    href: '/shield/scan',
    title: 'Scan a quote',
    desc: 'Spot risky payment terms, vague scope, and missing protections before you sign.',
  },
  {
    href: '/shield/rescue',
    title: 'Get dispute help',
    desc: 'Generate cleaner demand letters and complaint drafts if a job goes sideways.',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.2),transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#172554_100%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-200 mb-6">
                <Sparkles className="h-4 w-4" />
                Prybar Vision with Shield built in
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-5">
                Plan your home project from one photo, before you spend real money.
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-xl">
                Prybar Vision gives you a rough budget range, materials plan, contractor-ready brief, and optional design concepts. Prybar Shield helps you vet who you hire next.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
                <Link
                  href="/vision/start"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  <Camera className="h-5 w-5" />
                  Start with a photo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shield"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Explore Shield
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-300">
                {TRUST_POINTS.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 inline-flex rounded-2xl bg-blue-500/15 p-3 text-blue-200">
                  <DollarSign className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Planning-grade estimate</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  See a realistic rough range, key cost drivers, and what to confirm before a contractor visit.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 inline-flex rounded-2xl bg-violet-500/15 p-3 text-violet-200">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Briefs and materials</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Walk into quote conversations with cleaner scope notes, material ideas, and better questions.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/15 p-3 text-emerald-200">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Shield is your trust layer</h2>
                    <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                      Verify licenses, scan quotes, and pressure-test contractors before you move from inspiration to deposits.
                    </p>
                  </div>
                  <Link
                    href="/shield/check"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200"
                  >
                    Check a contractor
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How Prybar works</h2>
            <p className="text-slate-600 text-lg">
              Built for the moment before quotes, when you want clarity without committing to contractor outreach yet.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-blue-600">Step {item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Project types Prybar can help frame</h2>
              <p className="text-slate-600 text-lg">Common upgrades, repairs, remodels, and a custom path for everything else.</p>
            </div>
            <Link href="/vision/start" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Start a project
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(PROJECT_CATEGORIES).map(([key, cat]) => (
              <Link
                key={key}
                href="/vision/start"
                className="group rounded-3xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-4 text-3xl">{cat.emoji}</div>
                <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600">{cat.label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 mb-4">
                <ShieldCheck className="h-4 w-4 text-slate-900" />
                Prybar Shield
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Don&apos;t just plan the project. Pressure-test who touches it.
              </h2>
              <p className="text-lg leading-relaxed text-slate-600 mb-6 max-w-xl">
                Shield keeps the trust layer simple: verify the contractor, scan the paperwork, and get help if a job starts slipping.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/shield"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Explore Shield
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shield/check"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3.5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Check a contractor first
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {SHIELD_TOOLS.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600">{tool.title}</h3>
                      <p className="text-sm leading-relaxed text-slate-600">{tool.desc}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start with clarity, then decide what to do next.</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Prybar is designed to help you think clearly before spending, hiring, or getting rushed into a quote.
          </p>
          <Link
            href="/vision/start"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Start with a photo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
