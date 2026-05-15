import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
 ArrowRight,
 CheckCircle2,
 MapPinned,
 MessageSquareText,
 ShieldCheck,
 Sparkles,
 Users,
 FileText,
 Zap,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
 title: "For Pros — Naili",
 description:
  "Join the Naili contractor network. Receive better-scoped homeowner requests with clear briefs, honest estimates, and photo context.",
 alternates: {
  canonical: absoluteUrl("/pro"),
 },
 openGraph: {
  url: absoluteUrl("/pro"),
 },
};

const BENEFITS = [
 {
  title: "Better project context",
  desc: "Every request arrives with the homeowner brief, photo history, estimate context, and walk-through questions — so you start ahead.",
  icon: MessageSquareText,
 },
 {
  title: "Selective matching",
  desc: "Naili uses ZIP code and trade fit to narrow the shortlist instead of blasting requests widely. Fewer leads, better fit.",
  icon: MapPinned,
 },
 {
  title: "Trust before contact",
  desc: "Homeowners compare from the same written scope instead of starting every call from zero. Cleaner conversations from day one.",
  icon: ShieldCheck,
 },
];

const STEPS = [
 "A homeowner completes their Naili project brief and requests local contractor options.",
 "Naili matches by ZIP code and trade fit — narrowing to a short list, not a blast.",
 "Matched pros receive the same project packet the homeowner uses to compare bids.",
];

const CONTRACTOR_FAQS = [
 {
  question: "Is there a lead fee during early access?",
  answer:
   "No. Early access is free while we prove the homeowner experience and matching quality. No pay-to-play during launch.",
 },
 {
  question: "What does a matched request include?",
  answer:
   "A cleaner handoff: project summary, homeowner goals, estimate context, source photo, and walk-through questions when available.",
 },
 {
  question: "Do homeowners get sent to lots of contractors?",
  answer:
   "No. The model is intentionally selective — smaller, better-fit routing based on trade and location, not volume.",
 },
 {
  question: "How do I get started?",
  answer:
   "Request early access below. We'll review your trade coverage and service area, then add you to the directory as we grow the network in your region.",
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
  <main className="relative z-10 bg-canvas">
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
   />
   <Nav />

   {/* Hero */}
   <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-40">
    <div className="absolute inset-0 -z-10">
     <div className="absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2 bg-radial-warm opacity-60" />
    </div>
    <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
     <div>
      <div className="mb-6 flex items-center gap-2.5">
       <div className="ai-pulse" />
       <span className="mono-label">for contractors</span>
      </div>
      <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl">
       Better leads start with{" "}
       <span className="italic bg-gradient-to-r from-sand-dark to-sand bg-clip-text text-transparent">
        better briefs.
       </span>
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600 md:text-xl">
       Naili helps homeowners get clear before they contact you. That means tighter scope, realistic expectations, and fewer wasted site visits.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
       <Link
        href="#access"
        className="btn-primary bg-gradient-to-r from-sand-dark to-sand border-0 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
       >
        Request early access
        <ArrowRight className="ml-2 h-5 w-5" />
       </Link>
       <span className="text-sm text-ink-500">Free during launch — no lead fees.</span>
      </div>
     </div>

     <div className="relative">
      <div className="pointer-events-none absolute -inset-10 rounded-full bg-sand/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-hairline shadow-lift">
       <Image
        src="/imagery/contractors-hero.webp"
        alt="Contractor checking project details on phone between jobs"
        width={1600}
        height={1200}
        className="h-full w-full object-cover"
        priority
       />
      </div>
     </div>
    </div>
   </section>

   {/* Benefits */}
   <section className="relative z-10 border-y border-hairline bg-canvas-50 px-6 py-16 md:px-10 sm:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="grid gap-5 lg:grid-cols-3">
      {BENEFITS.map((item) => (
       <div
        key={item.title}
        className="rounded-3xl border border-hairline bg-canvas p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
       >
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sand/15">
         <item.icon className="h-6 w-6 text-sand-dark" />
        </div>
        <h2 className="mt-4 font-display text-xl tracking-tight text-ink">
         {item.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.desc}</p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* How it works */}
   <section className="px-6 py-16 md:px-10 sm:py-20">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
     <div>
      <span className="mono-label">how the network works</span>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
       Homeowner first, contractor-ready when it matters.
      </h2>
      <p className="mt-4 text-lg leading-relaxed text-ink-600">
       Naili helps homeowners get clear first. The directory exists so the right pro can step in later — without losing the scope work.
      </p>
     </div>
     <div className="rounded-3xl border border-hairline bg-canvas-50 p-8 shadow-soft">
      <ul className="space-y-5">
       {STEPS.map((step, i) => (
        <li key={step} className="flex gap-4">
         <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sand/15">
          <span className="text-sm font-bold text-sand-dark">{i + 1}</span>
         </div>
         <span className="text-sm leading-relaxed text-ink-600 pt-1">{step}</span>
        </li>
       ))}
      </ul>
     </div>
    </div>
   </section>

   {/* Current promise */}
   <section className="px-6 py-16 md:px-10 sm:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="rounded-3xl border border-hairline bg-canvas-50 p-8 shadow-soft lg:p-10">
      <span className="mono-label">live now</span>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
       The current promise is deliberately modest.
      </h2>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
       Free early access, better homeowner context, and a quieter matching model while the directory is still small.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
       <div className="rounded-2xl border border-hairline bg-canvas p-6">
        <div className="flex items-center gap-2 mb-3">
         <Zap className="h-4 w-4 text-sand-dark" />
         <span className="mono-label">what we avoid</span>
        </div>
        <h3 className="font-display text-lg tracking-tight text-ink">
         Marketplace spam
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
         No anonymous junk leads or broad quote blasts. The network should feel tighter and more useful than that.
        </p>
       </div>
       <div className="rounded-2xl border border-hairline bg-canvas p-6">
        <div className="flex items-center gap-2 mb-3">
         <Users className="h-4 w-4 text-mint" />
         <span className="mono-label">what homeowners feel</span>
        </div>
        <h3 className="font-display text-lg tracking-tight text-ink">
         Clear before contact
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
         Homeowners arrive with a cleaner brief, which usually means better first conversations for everyone.
        </p>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* FAQ */}
   <section className="px-6 py-16 md:px-10 sm:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="mb-10 max-w-3xl">
      <span className="mono-label">contractor FAQ</span>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
       Questions worth asking early.
      </h2>
     </div>
     <div className="grid gap-5 lg:grid-cols-2">
      {CONTRACTOR_FAQS.map((faq) => (
       <div
        key={faq.question}
        className="rounded-2xl border border-hairline bg-canvas-50 p-6 shadow-soft"
       >
        <h3 className="font-display text-lg tracking-tight text-ink">
         {faq.question}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
         {faq.answer}
        </p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* CTA */}
   <section id="access" className="px-6 py-16 md:px-10 sm:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="rounded-3xl border border-sand/20 bg-gradient-to-br from-sand/10 to-mint/10 p-8 text-center shadow-soft lg:p-12">
      <Sparkles className="mx-auto h-8 w-8 text-sand-dark mb-4" />
      <h2 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
       Ready to join the network?
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
       We're building the directory region by region. Request early access and we'll reach out when we're active in your area.
      </p>
      <div className="mt-8">
       <Link
        href="mailto:pros@naili.ai?subject=Contractor%20early%20access%20request"
        className="btn-primary bg-gradient-to-r from-sand-dark to-sand border-0 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8 py-4"
       >
        Request early access
        <ArrowRight className="ml-2 h-5 w-5" />
       </Link>
       <p className="mt-4 text-sm text-ink-500">
        No fees during launch. We'll confirm your trade and service area first.
       </p>
      </div>
     </div>
    </div>
   </section>

   <Footer />
  </main>
 );
}
