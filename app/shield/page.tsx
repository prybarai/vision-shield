import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, LifeBuoy, Search, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'naili shield',
  description:
    'Verify contractor licenses, scan quotes, review contracts, and protect yourself before money or signatures move.',
  alternates: {
    canonical: 'https://naili.ai/shield',
  },
  openGraph: {
    title: 'naili shield',
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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#1a1a2e_0%,#16213e_40%,#0f3460_70%,#533483_100%)] px-6 py-10 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)] sm:px-8 sm:py-12 lg:px-12 mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(233,69,96,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,166,35,0.12),transparent_24%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 mb-5">
            <ShieldCheck className="h-4 w-4 text-[#ffd27a]" />
            naili shield
          </div>
          <h1 className="text-4xl font-bold text-balance md:text-5xl">Hire with confidence. Never get burned.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/76">
            Before you hand over a deposit, run a naili shield check. Verify licenses, scan quotes for red flags, review contracts for risky clauses, and generate practical next steps if something goes wrong.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shield/check"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d0d1a] transition-colors hover:bg-slate-100"
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

      <section>
        <div className="grid gap-5 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(83,52,131,0.14)]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0ff] text-[#533483]">
                <tool.icon className="h-6 w-6" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{tool.eyebrow}</p>
              <h2 className="text-xl font-bold text-[#0d0d1a] transition-colors group-hover:text-[#533483]">{tool.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 mb-5">{tool.desc}</p>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#533483]">
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
