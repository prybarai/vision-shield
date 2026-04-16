import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const TRUST_POINTS = [
  'Free to start',
  'Private by default',
  'No contractor calls until you ask',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Nail the vision',
    desc: 'Upload a photo or describe your project. naili generates concept images and a real cost range.',
    icon: Camera,
  },
  {
    step: '02',
    title: 'Know the cost',
    desc: 'Get an honest estimate with a full materials breakdown. No contractor needed to figure out what something should cost.',
    icon: DollarSign,
  },
  {
    step: '03',
    title: 'Trust who you hire',
    desc: 'Run a naili shield check before the first phone call. License verified. Quote scanned. Contract reviewed.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Walk in ready',
    desc: 'Share your project brief with contractors. You show up with a plan, a number, and zero guesswork.',
    icon: ClipboardCheck,
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
                naili vision + naili shield
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance mb-5">
                Nail the vision. Know the cost.
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
                AI-powered home project planning. See what your project could look like, know what it should cost, and hire with total confidence — before any contractor shows up.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-4">
                <Link
                  href="/vision/start"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  <Camera className="h-5 w-5" />
                  Nail my project
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  See how it works
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
                <h2 className="text-lg font-semibold mb-2">What this should cost</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  See a planning-grade range, cost drivers, and a materials breakdown before quote season starts.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="mb-3 inline-flex rounded-2xl bg-violet-500/15 p-3 text-violet-200">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Your contractor-ready brief</h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Walk in with scope notes, material direction, and better questions instead of guesswork.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:col-span-2">
                <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/15 p-3 text-emerald-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Hire with confidence</h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                  Verify licenses, scan quotes for red flags, review contracts, and slow bad decisions down before money moves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-4">
                <Sparkles className="h-4 w-4" />
                naili vision
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">See the project before it starts.</h2>
              <p className="text-lg leading-relaxed text-slate-600">
                Upload a photo of your space, tell us what you&apos;re dreaming about, and naili builds you a complete picture — AI concept images, real cost ranges, a materials list, and a contractor-ready brief. All before you talk to a single contractor.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 mb-4">
                <ShieldCheck className="h-4 w-4 text-slate-900" />
                naili shield
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Hire with confidence. Never get burned.</h2>
              <p className="text-lg leading-relaxed text-slate-600">
                Before you hand over a deposit, run a naili shield check. Verify contractor licenses, scan quotes for red flags, review contracts for risky clauses, and generate dispute letters if something goes wrong.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-600 text-lg">
              naili helps homeowners show up prepared, informed, and hard to pressure.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
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

      <section className="bg-slate-950 py-14 text-white sm:py-18">
        <div className="max-w-4xl mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Walk into the job with a plan, a number, and zero guesswork.</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            naili gives you the clarity to plan the project, sanity-check the cost, and hire on your terms.
          </p>
          <Link
            href="/vision/start"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Nail my project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
