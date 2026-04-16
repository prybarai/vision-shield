import Link from 'next/link';
import {
  ArrowRight,
  Bath,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileText,
  Home,
  LayoutGrid,
  Paintbrush,
  ShieldCheck,
  Sofa,
  Sparkles,
  Trees,
  Wrench,
} from 'lucide-react';

const TRUST_POINTS = [
  '10,000+ projects planned',
  'Trusted by homeowners in all 50 states',
  'Private by default',
  'No contractor calls until you ask',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload a real photo',
    desc: 'Show naili the room, exterior, or project area you want to change. One good image is enough to start.',
    icon: Camera,
  },
  {
    step: '02',
    title: 'Describe what you want',
    desc: 'Tell naili what you want the space to feel like, what needs fixing, and what budget you want to respect.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Get your plan',
    desc: 'See concepts, a smart estimate, materials guidance, and a contractor-ready brief built from your actual photo.',
    icon: DollarSign,
  },
  {
    step: '04',
    title: 'Hire with confidence',
    desc: 'Use shield to verify licenses, scan quotes, and slow risky contractor decisions down before money moves.',
    icon: ShieldCheck,
  },
];

const PROJECT_TYPES = [
  { label: 'Kitchen refresh', icon: Home, desc: 'Cabinets, counters, backsplash, appliances' },
  { label: 'Bathroom remodel', icon: Bath, desc: 'Tile, vanity, shower, fixtures' },
  { label: 'Exterior paint', icon: Paintbrush, desc: 'Body, trim, accents, curb appeal' },
  { label: 'Interior paint', icon: LayoutGrid, desc: 'Walls, ceilings, trim, fresh color' },
  { label: 'Deck and patio', icon: Sofa, desc: 'Outdoor living and entertaining space' },
  { label: 'Landscaping', icon: Trees, desc: 'Planting, cleanup, hardscape, yard shape' },
];

const EXAMPLE_CARDS = [
  {
    eyebrow: 'Bathroom',
    title: 'Spa-like refresh under a real budget',
    before: 'Dated ceramic tile, single vanity, low lighting',
    after: 'Warm modern palette, calmer lighting, smarter materials mix',
  },
  {
    eyebrow: 'Kitchen',
    title: 'Same footprint, cleaner finish direction',
    before: 'Oak cabinets, laminate counters, crowded visual feel',
    after: 'White shaker cabinetry, quartz look, better visual flow',
  },
  {
    eyebrow: 'Exterior',
    title: 'Curb appeal without guesswork',
    before: 'Flat paint, unclear color direction, quote anxiety',
    after: 'Body/trim palette, cost range, and shield-ready hiring plan',
  },
];

const SEO_TOPICS = [
  'How much does a bathroom remodel cost?',
  'How much does a new roof cost?',
  'How much does interior painting cost?',
  'Questions to ask a contractor before hiring',
];

const FREE_FEATURES = [
  '2 Vision projects per month',
  'Basic estimate range',
  '1 Shield check per month',
  'Shareable project results',
];

const PRO_FEATURES = [
  'Unlimited Vision projects',
  'Full estimate breakdown',
  'Detailed materials list',
  'PDF brief download',
  'Unlimited Shield tools',
  'Priority lead matching',
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_40%,#0f3460_70%,#533483_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,69,96,0.26),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,166,35,0.14),transparent_26%)]" />
        <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#e94560]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#ffd27a]" />
              naili vision + shield
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Nail the vision. Know the cost.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/78 sm:text-xl">
              The homeowner AI platform for the moment before anything starts. Upload a photo, describe what you want, get a real plan, then hire with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/vision/start"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#e94560_0%,#533483_100%)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_rgba(233,69,96,0.32)] transition-opacity hover:opacity-95"
              >
                <Camera className="h-5 w-5" />
                Upload a photo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shield"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore shield
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/72">
              {['Free to start', 'Planning-grade estimate', 'No contractor outreach yet'].map((item) => (
                <div key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#ffd27a]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl sm:col-span-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/75">
                <Camera className="h-3.5 w-3.5" /> Vision flow
              </div>
              <h2 className="text-2xl font-bold">Upload a room. Describe the goal. Get the plan.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/74">
                naili analyzes the actual photo, builds concept directions, calculates a local cost range, drafts materials guidance, and creates a contractor-ready brief you can share.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-3 inline-flex rounded-2xl bg-[#fff4d9]/15 p-3 text-[#ffd27a]">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Smart estimate</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Low, mid, and high ranges with photo-aware assumptions and local market context.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Brief to share</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Show contractors what you want before they quote, so scope stays cleaner from the start.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-sm font-medium text-slate-600 sm:px-6 lg:px-8">
          {TRUST_POINTS.map((item) => (
            <div key={item} className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e94560]" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#533483]">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Built for the moment before the contractor call.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">naili helps homeowners show up informed, specific, and a lot harder to overcharge.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(83,52,131,0.14)]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#533483]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-[#e94560]">Step {item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-[#0d0d1a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#533483]">Example outcomes</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">From unclear project to clear direction.</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">Every result should feel like naili looked at your actual space, not a generic category template.</p>
            </div>
            <Link href="/vision/start" className="inline-flex items-center gap-2 text-sm font-semibold text-[#533483] hover:text-[#e94560]">
              Start a project now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {EXAMPLE_CARDS.map((card) => (
              <div key={card.title} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <div className="bg-[linear-gradient(135deg,rgba(233,69,96,0.1),rgba(83,52,131,0.1))] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#533483]">{card.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-bold text-[#0d0d1a]">{card.title}</h3>
                </div>
                <div className="grid grid-cols-2 gap-0 border-t border-slate-200">
                  <div className="border-r border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Before</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.before}</p>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">After</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{card.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#533483]">Project types</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Start with the project you actually have.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">From kitchen refreshes to outdoor work, naili is designed to turn homeowner uncertainty into a clearer plan.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PROJECT_TYPES.map((type) => (
              <Link key={type.label} href="/vision/start" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(83,52,131,0.14)]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#533483]">
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[#0d0d1a]">{type.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{type.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_40%,#0f3460_70%,#533483_100%)] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">naili shield</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Hire with confidence, not anxiety.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/74">Verify contractor licenses, scan quotes, review risky contract language, and slow bad decisions down before deposits or signatures happen.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shield" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d0d1a] transition-colors hover:bg-slate-100">
                Explore shield <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shield/check" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10">
                Check a contractor
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <ShieldCheck className="h-6 w-6 text-[#ffd27a]" />
              <h3 className="mt-4 text-lg font-semibold">License checks</h3>
              <p className="mt-2 text-sm text-white/70">Verify contractor status before you trust the quote.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <ClipboardCheck className="h-6 w-6 text-[#ffd27a]" />
              <h3 className="mt-4 text-lg font-semibold">Quote scanner</h3>
              <p className="mt-2 text-sm text-white/70">Catch vague scope, payment risks, and missing protections.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur sm:col-span-2">
              <Wrench className="h-6 w-6 text-[#ffd27a]" />
              <h3 className="mt-4 text-lg font-semibold">Contract help if things go sideways</h3>
              <p className="mt-2 text-sm text-white/70">Generate clearer next steps and dispute drafts if the job starts going wrong.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#533483]">Most searched questions</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">The cost-guide engine that grows with the product.</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">naili is building a library of cost guides, planning advice, and homeowner answers that bring people in before they even upload a photo.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {SEO_TOPICS.map((topic) => (
                <div key={topic} className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-5">
                  <div className="text-sm font-semibold text-[#0d0d1a]">{topic}</div>
                  <p className="mt-2 text-sm text-slate-600">Coming into the naili cost guide library.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl text-center mx-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#533483]">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Start free, upgrade when you want the full playbook.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">naili free</p>
              <h3 className="mt-3 text-3xl font-bold text-[#0d0d1a]">$0</h3>
              <p className="mt-2 text-slate-600">Enough to test the planning flow and see the product in action.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />{feature}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] border border-[#ffd2d9] bg-[linear-gradient(135deg,rgba(233,69,96,0.08),rgba(83,52,131,0.08))] p-8 shadow-[0_16px_44px_rgba(83,52,131,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b02c4c]">naili pro</p>
              <h3 className="mt-3 text-3xl font-bold text-[#0d0d1a]">$19<span className="text-lg text-slate-500">/month</span></h3>
              <p className="mt-2 text-slate-700">For homeowners who want the full estimate, materials, shield, and project history stack.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#e94560]" />{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
