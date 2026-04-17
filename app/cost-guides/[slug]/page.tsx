import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, FileText } from 'lucide-react';
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
      images: [
        {
          url: absoluteUrl(guide.heroImage),
          alt: guide.heroAlt,
        },
      ],
    },
  };
}

function formatGuideDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateString}T00:00:00Z`));
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
    image: [absoluteUrl(guide.heroImage)],
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      '@type': 'Organization',
      name: guide.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'naili',
      url: absoluteUrl('/'),
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
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:px-8 lg:py-24">
          <div>
            <Link href="/cost-guides" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white">
              ← Back to cost guides
            </Link>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/60">naili cost guide</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">{guide.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Published</div>
                <div className="mt-2 text-sm font-medium text-white">{formatGuideDate(guide.publishedAt)}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Updated</div>
                <div className="mt-2 text-sm font-medium text-white">{formatGuideDate(guide.updatedAt)}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur sm:col-span-2 xl:col-span-1">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Reviewed</div>
                <div className="mt-2 text-sm font-medium text-white">{guide.reviewer.name}</div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/10 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
            <Image src={guide.heroImage} alt={guide.heroAlt} width={1536} height={1024} className="aspect-[16/10] w-full object-cover" sizes="(max-width: 1024px) 100vw, 520px" priority />
            <div className="border-t border-white/12 bg-[#0d2340]/50 px-6 py-4 text-sm text-white/74">
              Illustrative editorial image for the guide topic.
            </div>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-[#f8f9fc] p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700"><FileText className="h-4 w-4 text-[#1f7cf7]" /> By {guide.author.name}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700"><CalendarDays className="h-4 w-4 text-[#1f7cf7]" /> Updated {formatGuideDate(guide.updatedAt)}</span>
              </div>
              <div className="mt-5 space-y-5 text-lg leading-relaxed text-slate-700">
                {guide.intro.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <section className="mt-10 rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Planning table</p>
                <h2 className="mt-2 text-3xl font-bold text-[#0d0d1a]">Typical cost ranges at a glance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8f9fc] text-sm uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-6 py-4 font-semibold">Scope level</th>
                      <th className="px-6 py-4 font-semibold">Typical range</th>
                      <th className="px-6 py-4 font-semibold">What that usually includes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.ranges.map((item) => (
                      <tr key={item.label} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-6 py-4 text-base font-semibold text-[#0d0d1a]">{item.label}</td>
                        <td className="px-6 py-4 text-base font-semibold text-[#1f7cf7]">{item.range}</td>
                        <td className="px-6 py-4 text-base leading-relaxed text-slate-700">{item.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10 rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">What moves the number</p>
                <h2 className="mt-2 text-3xl font-bold text-[#0d0d1a]">The biggest cost drivers to pressure-test in quotes</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8f9fc] text-sm uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-6 py-4 font-semibold">Cost driver</th>
                      <th className="px-6 py-4 font-semibold">Impact</th>
                      <th className="px-6 py-4 font-semibold">Why it matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.budgetFactors.map((factor) => (
                      <tr key={factor.item} className="border-b border-slate-200 last:border-b-0">
                        <td className="px-6 py-4 text-base font-semibold text-[#0d0d1a]">{factor.item}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${factor.impact === 'High' ? 'bg-[#eef8ff] text-[#0f5fc6]' : 'bg-[#f4f7e8] text-[#587f1d]'}`}>
                            {factor.impact}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-base leading-relaxed text-slate-700">{factor.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10 rounded-[2rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.08),rgba(72,199,241,0.08))] p-8 shadow-[0_16px_44px_rgba(72,199,241,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f5fc6]">Turn this into your real project</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a]">Upload a photo and get a tighter range for your actual space.</h2>
              <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-700">
                These guides are here to orient you. Naili gets more useful when it can see your actual room, yard, roofline, or project area and turn that into a clearer brief before contractor quotes start.
              </p>
              <div className="mt-6">
                <Link href="/vision/start" className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_14px_40px_rgba(31,124,247,0.24)] transition-opacity hover:opacity-95">
                  Upload my project photo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

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

            <section className="mt-12 rounded-[2rem] border border-slate-200 bg-[#f8f9fc] p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Frequently asked questions</p>
              <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a]">Common follow-up questions</h2>
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
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Guide review</p>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700">
                <div>
                  <div className="font-semibold text-[#0d0d1a]">Written by</div>
                  <div className="mt-1">{guide.author.name}</div>
                  <div className="text-slate-500">{guide.author.role}</div>
                </div>
                <div>
                  <div className="font-semibold text-[#0d0d1a]">Reviewed by</div>
                  <div className="mt-1">{guide.reviewer.name}</div>
                  <div className="text-slate-500">{guide.reviewer.role}</div>
                </div>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Quote checklist</p>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                {guide.quoteChecklist.map((item) => (
                  <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#1f7cf7]" /><span>{item}</span></li>
                ))}
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
