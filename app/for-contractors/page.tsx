import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageSquareText, Smartphone, Wrench } from 'lucide-react';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For contractors',
  description: 'Get free homeowner leads from naili and route them into your Prybar inbox so you can respond fast while you are still on the job.',
  alternates: {
    canonical: absoluteUrl('/for-contractors'),
  },
};

const BENEFITS = [
  {
    title: 'Real homeowner leads, already scoped',
    desc: 'naili sends homeowner requests that already include the project brief, estimate context, photos, and scope summary.',
    icon: Wrench,
  },
  {
    title: 'Route them straight into Prybar',
    desc: 'Sign up for Prybar and those leads can land in the same place you already handle inbound messages and follow-up.',
    icon: Smartphone,
  },
  {
    title: 'Reply faster, miss fewer jobs',
    desc: 'The point is simple: fewer missed leads while you are on a ladder, in a truck, or between jobsites.',
    icon: MessageSquareText,
  },
];

const STEPS = [
  'A homeowner completes a Naili brief and asks to be matched with local pros.',
  'If you cover that ZIP and trade, Naili routes the lead through Prybar first.',
  'You see the homeowner context before the first conversation, so you can respond faster and walk into the quote with the scope already framed.',
];

const CONTRACTOR_FAQS = [
  {
    question: 'Do Naili leads cost money during launch?',
    answer:
      'The current contractor-facing promise is free homeowner leads. The goal is to prove the quality of the loop first, not to trap contractors in a junk-lead marketplace model.',
  },
  {
    question: 'What comes with the lead?',
    answer:
      'The lead starts with homeowner context, project brief details, and estimate or scope framing that helps you respond without starting from zero.',
  },
  {
    question: 'Do I need Prybar to receive them automatically?',
    answer:
      'Yes, that is the current operating path. Prybar is what lets Naili route the lead into a contractor workflow built for fast response instead of dropped follow-up.',
  },
  {
    question: 'Is this a broad marketplace blast?',
    answer:
      'No. The intent is tighter routing based on trade and ZIP coverage, so the lead lands with contractors who actually fit the job instead of getting sprayed everywhere.',
  },
];

export default function ForContractorsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CONTRACTOR_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">For contractors</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Free homeowner leads, with the brief already done.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">
              Naili sends real homeowner leads, free, with the project already scoped. To receive those leads automatically and respond fast, sign up for Prybar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="https://prybar.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d2340] transition-colors hover:bg-slate-100"
              >
                See Prybar signup <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="https://prybar.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                View founding member pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {BENEFITS.map((item) => (
              <div key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#48c7f1]">
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-[#0d0d1a]">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">How the loop works</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Naili brings the lead in. Prybar helps you close it fast.</h2>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              This is not another lead marketplace charging you for junk. The homeowner already did the work to define the project. Prybar is what lets you respond without missing the moment.
            </p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-[#f8f9fc] p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <ul className="space-y-4 text-sm leading-relaxed text-slate-700">
              {STEPS.map((step) => (
                <li key={step} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#1f7cf7]" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Built for real operators</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">No fake testimonials, no paid-looking fluff.</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
              As real Naili leads turn into real Prybar jobs, this page will fill with contractor quotes, close stories, and honest numbers. Until then, we are keeping the promise simple: free leads, clearer context, and faster response loops.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live now</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Free lead promise</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Contractors are not being asked to buy anonymous junk leads. The pitch is free homeowner opportunities with better context.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live now</p>
                <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Context before contact</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The homeowner brief is meant to show up before the first conversation, so the contractor can respond faster and with a cleaner understanding of the job.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Contractor FAQ</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">The questions a skeptical contractor should ask.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {CONTRACTOR_FAQS.map((faq) => (
              <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <h3 className="text-lg font-semibold text-[#0d0d1a]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
