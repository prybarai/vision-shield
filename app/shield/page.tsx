import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, LifeBuoy, Search, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Naili Shield',
  description:
    'Verify contractor licenses, scan quotes, review contracts, and protect yourself before money or signatures move.',
  alternates: {
    canonical: 'https://naili.ai/shield',
  },
  openGraph: {
    title: 'Naili Shield',
    description: 'Hire with confidence. Never get burned.',
    url: 'https://naili.ai/shield',
    images: ['/og-naili.png'],
  },
};

export default function ShieldPage() {
  const tools = [
    {
      href: '/shield/check',
      icon: Search,
      title: 'Check a contractor',
      desc: 'Verify license status, combine it with trust signals, and get a calmer risk read before sending money.',
      eyebrow: 'Before you hire',
    },
    {
      href: '/shield/scan',
      icon: FileText,
      title: 'Scan a quote or contract',
      desc: 'Catch vague scope, aggressive payment terms, and missing protections before you sign.',
      eyebrow: 'Before you sign',
    },
    {
      href: '/shield/rescue',
      icon: LifeBuoy,
      title: 'Get dispute help',
      desc: 'Generate practical drafts and organize your next steps if a project has already gone sideways.',
      eyebrow: 'If things go wrong',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_60%,#1e293b_100%)] px-5 py-10 text-white sm:px-8 sm:py-12 lg:px-12 mb-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-slate-100 mb-5">
            <ShieldCheck className="h-4 w-4" />
            Naili Shield
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
            Hire with confidence. Never get burned.
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl leading-relaxed mb-7">
            Before you hand over a deposit, run a Naili Shield check. Verify licenses, scan quotes for red flags, review contracts for risky clauses, and generate dispute letters if something goes wrong.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/shield/check"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Check a contractor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/connect"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Find vetted contractors
            </Link>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="grid gap-5 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                <tool.icon className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{tool.eyebrow}</p>
              <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{tool.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600 mb-5">{tool.desc}</p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                Open tool
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
