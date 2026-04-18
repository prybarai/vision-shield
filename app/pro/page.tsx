import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPinned, MessageSquareText, ShieldCheck } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
 title: "For pros — Naili",
 description: "Join the Naili contractor directory and receive better-scoped homeowner requests as the network grows.",
 alternates: {
  canonical: absoluteUrl("/pro"),
 },
 openGraph: {
  url: absoluteUrl("/pro"),
 },
};

const BENEFITS = [
 {
  title: "Directory-first positioning",
  desc: "Naili is building a quieter local network, not a spray-and-pray lead marketplace.",
  icon: MapPinned,
 },
 {
  title: "Better project context",
  desc: "Requests arrive with the homeowner brief, estimate context, photo history, and walk-through questions.",
  icon: MessageSquareText,
 },
 {
  title: "Trust before contact",
  desc: "Homeowners can compare from the same written scope instead of starting every call from zero.",
  icon: ShieldCheck,
 },
];

const STEPS = [
 "A homeowner finishes a Naili brief and asks for local contractor options.",
 "Naili uses ZIP and trade fit to narrow the shortlist instead of blasting the request widely.",
 "Matched pros receive the same project packet the homeowner is using to compare bids.",
];

const CONTRACTOR_FAQS = [
 {
  question: "Is there a pay-to-play lead fee during launch?",
  answer:
   "No. The current model is a free directory and network while Naili proves the homeowner experience and routing quality.",
 },
 {
  question: "What does a matched request include?",
  answer:
   "The goal is a cleaner handoff: project summary, homeowner goals, estimate context, source photo, and walk-through questions when available.",
 },
 {
  question: "Do homeowners get sprayed to lots of contractors?",
  answer:
   "That is not the intent. The operating direction is smaller, better-fit routing based on trade and location coverage.",
 },
 {
  question: "Why does Prybar still show up here?",
  answer:
   "Prybar is the current ops layer for receiving and responding quickly. Naili stays homeowner-facing, while Prybar helps the contractor side stay organized.",
 },
];

export default function ProPage() {
 const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CONTRACTOR_FAQS.map((faq) => ({
   "@type": "Question",
   name: faq.question,
   acceptedAnswer: {
    "@type": "Answer",
    text: faq.answer,
   },
  })),
 };

 return (
  <main className="bg-white">
   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
   <Nav />

   <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_70%,#48c7f1_100%)] pt-32 text-white md:pt-40">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,235,87,0.14),transparent_24%)]" />
    <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20 lg:py-24">
     <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
      <div className="max-w-4xl">
       <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">For pros</p>
       <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
        Join the Naili contractor directory.
       </h1>
       <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/78 sm:text-xl">
        The goal is simple, better-scoped homeowner requests, routed more selectively, with free early access while the network is still taking shape.
       </p>
       <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
         href="https://prybar.ai"
         target="_blank"
         rel="noopener noreferrer"
         className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#0d2340] transition-colors hover:bg-slate-100"
        >
         Join via Prybar <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-sm text-white/70">No lead fee during launch.</p>
       </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/10 shadow-[0_24px_90px_rgba(15,23,42,0.18)]">
       <Image
        src="/imagery/contractors-hero.webp"
        alt="Residential contractor standing near a work van and checking a phone between jobs."
        width={1600}
        height={1200}
        className="h-full w-full object-cover"
        priority
       />
      </div>
     </div>
    </div>
   </section>

   <section className="bg-[#f8f9fc] py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
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
    <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
     <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">How the network works</p>
      <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Homeowner first, contractor-ready when it matters.</h2>
      <p className="mt-3 text-lg leading-relaxed text-slate-600">
       Naili is designed to help homeowners get clear first. The directory exists so the right pro can step in later without losing the scope work.
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
    <div className="mx-auto max-w-7xl px-6 md:px-10">
     <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_12px_32px_rgba(15,23,42,0.06)] lg:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Live now</p>
      <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">The current promise is deliberately modest.</h2>
      <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
       Free early access, better homeowner context, and a quieter matching model while the directory is still small.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
       <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What Naili is trying to avoid</p>
        <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Marketplace spam</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
         The goal is not anonymous junk leads or broad quote blasts. The network should feel tighter and more useful than that.
        </p>
       </div>
       <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f9fc] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What the homeowner should feel</p>
        <h3 className="mt-3 text-lg font-semibold text-[#0d0d1a]">Clear before contact</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
         Homeowners should arrive with a cleaner brief, which usually means better first conversations for everyone involved.
        </p>
       </div>
      </div>
     </div>
    </div>
   </section>

   <section className="bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-6 md:px-10">
     <div className="mb-10 max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#48c7f1]">Contractor FAQ</p>
      <h2 className="mt-3 text-3xl font-bold text-[#0d0d1a] sm:text-4xl">Questions worth asking early.</h2>
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

   <Footer />
  </main>
 );
}
