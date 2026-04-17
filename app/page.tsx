import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bath,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  LayoutGrid,
  Paintbrush,
  ShieldCheck,
  Sofa,
  Sparkles,
  Trees,
  Users,
  Wrench,
} from 'lucide-react';
import BeforeAfterSlider from '@/components/vision/BeforeAfterSlider';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    url: absoluteUrl('/'),
  },
};

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload a real photo',
    desc: 'One clear photo is enough to start.',
    icon: Camera,
    image: '/imagery/step-upload-photo.webp',
    alt: 'Homeowner taking a project photo in a living room before starting a renovation plan.',
  },
  {
    step: '02',
    title: 'Describe what you want',
    desc: 'Add style, fixes, and budget.',
    icon: Sparkles,
    image: '/imagery/step-describe-project.webp',
    alt: 'Project notes, finish samples, and color swatches laid out on a kitchen table.',
  },
  {
    step: '03',
    title: 'Get the full brief',
    desc: 'Get concepts, cost range, and scope.',
    icon: FileText,
    image: '/imagery/step-get-plan.webp',
    alt: 'Renovation planning materials, a laptop, and estimate paperwork arranged on a table.',
  },
  {
    step: '04',
    title: 'Get matched to local pros',
    desc: 'Request 2–3 local pros when ready.',
    icon: Users,
    image: '/imagery/step-hire-confidence.webp',
    alt: 'Homeowner meeting a contractor at the front door with a clipboard in hand.',
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

const COST_GUIDE_LINKS = [
  { title: 'How much does a bathroom remodel cost?', href: '/cost-guides/bathroom-remodel-cost' },
  { title: 'How much does interior painting cost?', href: '/cost-guides/interior-painting-cost' },
  { title: 'How much does a deck cost to build?', href: '/cost-guides/deck-build-cost' },
  { title: 'How much does a new roof cost?', href: '/cost-guides/roof-replacement-cost' },
  { title: 'How much does a kitchen remodel cost?', href: '/cost-guides/kitchen-remodel-cost' },
];

const EXAMPLE_SLIDERS = [
  {
    eyebrow: 'Exterior',
    title: 'Backyard refresh',
    beforeImage: '/imagery/example-backyard-before.webp',
    afterImage: '/imagery/example-backyard-after.webp',
    beforeLabel: 'Before',
    afterLabel: 'Concept',
    detail: 'Landscape, lighting, and seating direction.',
  },
  {
    eyebrow: 'Interior',
    title: 'Attic reset',
    beforeImage: '/imagery/example-attic-before.webp',
    afterImage: '/imagery/example-attic-after.webp',
    beforeLabel: 'Before',
    afterLabel: 'Concept',
    detail: 'Paint, lighting, and storage direction.',
  },
];

const FREE_FEATURES = [
  '2 Vision projects per month',
  'Basic estimate range',
  '1 Shield check per month',
  'Project matching request when ready',
];

const PRO_FEATURES = [
  'Keep every project, brief, and estimate in one place',
  'See the full estimate breakdown, not just the topline range',
  'Get the complete materials list and planning detail',
  'Download a shareable PDF brief for contractor conversations',
  'Run Shield checks and quote scans as often as you need',
  'Get help faster when a project needs a closer look',
];

const HOME_FAQS = [
  {
    question: 'Will contractors contact me as soon as I upload a photo?',
    answer:
      'No. naili does not trigger contractor outreach just because you started a project. You stay private by default, and matching only begins when you explicitly ask for it.',
  },
  {
    question: 'Is the estimate the same thing as a final quote?',
    answer:
      'No. naili gives you a planning-grade range to help you frame scope, budget, and trade conversations. Final pricing still comes from an actual contractor quote after site-specific verification.',
  },
  {
    question: 'Do I need exact measurements before I start?',
    answer:
      'No. A solid photo, ZIP code, and a clear description of what you want are usually enough to start building a better brief and planning range.',
  },
  {
    question: 'Can I use Shield without asking for contractor matching?',
    answer:
      'Yes. Shield is there whether you use matching or not. You can verify a contractor, scan a quote, or review risk language on your own timeline.',
  },
  {
    question: 'What happens after I request matching?',
    answer:
      'naili saves your project brief and uses it to line up relevant local pros, so the first conversation starts with more context and less back-and-forth from scratch.',
  },
];

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'naili',
    url: absoluteUrl('/'),
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'naili',
    url: absoluteUrl('/'),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.16),transparent_26%)]" />
        <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-white/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#1f7cf7]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#a8eb57]" />
              naili vision + shield
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Start with a photo. Get clear scope before the sales calls.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/78 sm:text-xl">
              Upload a space. Get a cost range, a clear brief, and matched pros when you want them.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/vision/start"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_44px_rgba(31,124,247,0.32)] transition-opacity hover:opacity-95 sm:w-auto"
              >
                <Camera className="h-5 w-5" />
                Upload my project photo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-2 py-2 text-sm font-semibold text-white/88 transition-colors hover:text-white sm:justify-start"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/72">
              {['Free to start', 'Private by default', 'No contractor outreach until you opt in'].map((item) => (
                <div key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#a8eb57]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/10 shadow-[0_24px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:col-span-2">
              <Image
                src="/imagery/vision-hero.webp"
                alt="Homeowner reviewing a kitchen renovation idea while standing in the space."
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-3 inline-flex rounded-2xl bg-[#f4fde8]/15 p-3 text-[#a8eb57]">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Photo-aware brief</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">Estimate, materials, and scope notes grounded in the space you actually uploaded.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Matched pros</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">When you opt in, we use the brief to line up 2–3 local pros who can quote from the same scope.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">How it works</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">4 quick steps.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">Take one photo, answer a few questions, and keep moving.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(72,199,241,0.14)]">
                <div className="relative mb-5 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-100 aspect-[4/3]">
                  <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#48c7f1]">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-[#1f7cf7]">Step {item.step}</span>
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
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Before + concept</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">See the direction faster.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">Real spaces in, cleaner direction out.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {EXAMPLE_SLIDERS.map((example, index) => (
              <div key={example.title} className="rounded-[2rem] border border-slate-200 bg-[#f8f9fc] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)] sm:p-5">
                <div className="mb-4 px-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">{example.eyebrow}</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <h3 className="text-xl font-bold text-[#0d0d1a]">{example.title}</h3>
                    <p className="hidden text-sm text-slate-500 sm:block">{example.detail}</p>
                  </div>
                </div>
                <BeforeAfterSlider
                  beforeImage={example.beforeImage}
                  afterImage={example.afterImage}
                  beforeLabel={example.beforeLabel}
                  afterLabel={example.afterLabel}
                  priority={index === 0}
                />
                <p className="mt-3 px-1 text-sm text-slate-500 sm:hidden">{example.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Project types</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Choose the closest job type.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">Pick the nearest match and keep moving.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PROJECT_TYPES.map((type) => (
              <Link key={type.label} href="/vision/start" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(72,199,241,0.14)]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#48c7f1]">
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-[#0d0d1a]">{type.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{type.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">naili shield</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Still verify before you hire.</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/74">Verify licenses, scan quotes, and catch risky paperwork before deposits or signatures.</p>
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
              <ShieldCheck className="h-6 w-6 text-[#a8eb57]" />
              <h3 className="mt-4 text-lg font-semibold">License checks</h3>
              <p className="mt-2 text-sm text-white/70">Verify contractor status before you trust the quote.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur">
              <ClipboardCheck className="h-6 w-6 text-[#a8eb57]" />
              <h3 className="mt-4 text-lg font-semibold">Quote scanner</h3>
              <p className="mt-2 text-sm text-white/70">Catch vague scope, payment risks, and missing protections.</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/12 bg-white/10 p-5 backdrop-blur sm:col-span-2">
              <Wrench className="h-6 w-6 text-[#a8eb57]" />
              <h3 className="mt-4 text-lg font-semibold">Contract help if things go sideways</h3>
              <p className="mt-2 text-sm text-white/70">Generate clearer next steps and dispute drafts if the job starts going wrong.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">For contractors</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Free homeowner leads, already scoped.</h2>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
              For contractors, Naili can send leads with the photo, scope, and estimate context already attached.
            </p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-[#f8f9fc] p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <h3 className="text-xl font-bold text-[#0d0d1a]">See how Naili + Prybar works</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">One page, no fluff. If you just got offered a lead and want to know what Prybar has to do with it, this is the place to start.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/for-contractors" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.24)] transition-opacity hover:opacity-95">
                For contractors <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="https://prybar.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                Visit prybar.ai
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Cost guides</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Cost guides for common projects.</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-600">Start broad, then upload your own space for a tighter range.</p>
            </div>
            <Link href="/cost-guides" className="inline-flex items-center gap-2 text-sm font-semibold text-[#48c7f1] hover:text-[#1f7cf7]">
              Browse all guides <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {COST_GUIDE_LINKS.map((guide) => (
              <Link key={guide.href} href={guide.href} className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(72,199,241,0.14)]">
                <h3 className="text-base font-semibold leading-snug text-[#0d0d1a]">{guide.title}</h3>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1f7cf7]">
                  Read guide <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Live now</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">What you can use today.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live now</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Photo-first planning</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">You can upload a real project photo today and get concepts, estimate context, materials direction, and a contractor-ready brief.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live now</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Private matching flow</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Contractor outreach does not start automatically. Homeowners stay in control and opt into matching only when they are ready.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live now</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Shield protection tools</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">License checks, quote scanning, and dispute-help workflows are already live for homeowners who want another layer of caution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Questions before you start.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {HOME_FAQS.map((faq) => (
              <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg font-semibold text-[#0d0d1a]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl text-center mx-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Start free. Upgrade if you want more.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">naili free</p>
              <h3 className="mt-3 text-3xl font-bold text-[#0d0d1a]">$0</h3>
              <p className="mt-2 text-slate-600">Enough to test the planning flow, build a brief, and request matching when you are ready.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7ccf43]" />{feature}</li>
                ))}
              </ul>
              <Link
                href="/vision/start"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.24)] transition-opacity hover:opacity-95 sm:w-auto"
              >
                Upload my project photo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-[2rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.08),rgba(72,199,241,0.08))] p-8 shadow-[0_16px_44px_rgba(72,199,241,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f5fc6]">naili pro</p>
              <h3 className="mt-3 text-3xl font-bold text-[#0d0d1a]">$19<span className="text-lg text-slate-500">/month</span></h3>
              <p className="mt-2 text-slate-700">For homeowners who want more project history, deeper estimate detail, and full Shield access.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" />{feature}</li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#9adfff] bg-white px-5 py-3 text-sm font-semibold text-[#0f5fc6] transition-colors hover:bg-[#eef8ff] sm:w-auto"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0d2340_0%,#123964_45%,#165ca8_75%,#48c7f1_100%)] p-8 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:p-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Start with a real project</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">A photo is enough to start.</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/74">
                Use Vision for the plan. Use Shield before you hire.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/vision/start"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d2340] transition-colors hover:bg-slate-100 sm:w-auto"
              >
                <Camera className="h-5 w-5" />
                Upload my project photo
              </Link>
              <Link
                href="/shield"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ShieldCheck className="h-5 w-5" />
                Explore Shield
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
