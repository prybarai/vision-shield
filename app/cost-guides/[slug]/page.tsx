import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { COST_GUIDES, COST_GUIDE_MAP } from '@/lib/costGuides';
import { absoluteUrl } from '@/lib/site';

export function generateStaticParams() {
  return COST_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = COST_GUIDE_MAP[slug];

  if (!guide) {
    return {};
  }

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: absoluteUrl(`/cost-guides/${guide.slug}`),
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url: absoluteUrl(`/cost-guides/${guide.slug}`),
    },
  };
}

export default async function CostGuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = COST_GUIDE_MAP[slug];

  if (!guide) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    mainEntityOfPage: absoluteUrl(`/cost-guides/${guide.slug}`),
    author: {
      '@type': 'Organization',
      name: 'naili',
    },
    publisher: {
      '@type': 'Organization',
      name: 'naili',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((faq) => ({
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <Link href="/cost-guides" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
            ← Back to cost guides
          </Link>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{guide.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">{guide.description}</p>
        </div>
      </section>

      <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="space-y-5 text-lg leading-relaxed text-slate-700">
              {guide.intro.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {guide.ranges.map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-5">
                  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-bold text-[#0d0d1a]">{item.range}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-10">
              {guide.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-3xl font-bold text-[#0d0d1a]">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-lg leading-relaxed text-slate-700">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <section className="mt-12 rounded-[2rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.08),rgba(72,199,241,0.08))] p-8 shadow-[0_16px_44px_rgba(72,199,241,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f5fc6]">Get specific</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a]">Get a custom estimate for your specific space.</h2>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-700">
                Cost guides are useful for orientation. If you want a tighter range for your actual house, upload a photo and Naili will build the brief, estimate range, and contractor handoff around your real project.
              </p>
              <div className="mt-6">
                <Link href="/vision/start" className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.24)] transition-opacity hover:opacity-95">
                  Upload my project photo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold text-[#0d0d1a]">Frequently asked questions</h2>
              <div className="mt-6 space-y-4">
                {guide.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                    <h3 className="text-xl font-semibold text-[#0d0d1a]">{faq.question}</h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-700">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-3xl font-bold text-[#0d0d1a]">Sources</h2>
              <ul className="mt-4 space-y-3 text-base text-slate-700">
                {guide.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-[#1f7cf7] hover:text-[#0f5fc6]">
                      {source.label} <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.75rem] border border-slate-200 bg-[#f8f9fc] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">What to do with this</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" /><span>Use the ranges to set a planning budget, not a final contract price.</span></li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" /><span>Bring the guide into contractor conversations only after you define your real scope.</span></li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" /><span>Use Naili when you want a brief that reflects your actual space instead of a generic project average.</span></li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Next step</p>
              <h2 className="mt-3 text-2xl font-bold text-[#0d0d1a]">Start with your actual project.</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">Upload a photo, get a planning-grade estimate, and turn this broad guide into a real brief.</p>
              <div className="mt-5">
                <Link href="/vision/start" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f7cf7] hover:text-[#0f5fc6]">
                  Upload my project photo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
