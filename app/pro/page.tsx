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
 Zap,
 TrendingUp,
 Clock,
 FileText,
 ExternalLink,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ContractorSignupForm from "@/components/ContractorSignupForm";
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
  color: "bg-blue-50 text-blue-600",
 },
 {
  title: "Selective matching",
  desc: "Naili uses ZIP code and trade fit to narrow the shortlist instead of blasting requests widely. Fewer leads, better fit.",
  icon: MapPinned,
  color: "bg-emerald-50 text-emerald-600",
 },
 {
  title: "Trust before contact",
  desc: "Homeowners compare from the same written scope instead of starting every call from zero. Cleaner conversations from day one.",
  icon: ShieldCheck,
  color: "bg-amber-50 text-amber-600",
 },
];

const STATS = [
 { value: "3x", label: "Better close rate", desc: "vs. traditional lead gen" },
 { value: "0", label: "Lead fees", desc: "Free during early access" },
 { value: "24hr", label: "Response time", desc: "Homeowners expect fast" },
];

const STEPS = [
 {
  num: "01",
  title: "Homeowner creates a brief",
  desc: "A homeowner completes their Naili project brief and requests local contractor options.",
  icon: FileText,
 },
 {
  num: "02",
  title: "Smart matching by ZIP & trade",
  desc: "Naili matches by ZIP code and trade fit — narrowing to a short list, not a blast.",
  icon: MapPinned,
 },
 {
  num: "03",
  title: "You get the full project packet",
  desc: "Matched pros receive the same project packet the homeowner uses to compare bids.",
  icon: Zap,
 },
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
   "Fill out the signup form below. We'll review your trade coverage and service area, then add you to the directory as we grow the network in your region.",
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
  <main className="relative z-10 bg-stone-50">
   <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
   />
   <Nav />

   {/* Hero — mobile-first */}
   <section className="relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 sm:pb-20 sm:pt-28 md:px-10 md:pt-36">
    {/* Subtle gradient background */}
    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-100 via-stone-50 to-white" />

    <div className="mx-auto max-w-7xl">
     <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      {/* Text */}
      <div>
       <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">For contractors</span>
       </div>

       <h1 className="text-3xl font-bold leading-tight tracking-tight text-stone-800 sm:text-4xl md:text-5xl lg:text-[3.25rem]">
        Better leads start with{" "}
        <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
         better briefs.
        </span>
       </h1>

       <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-stone-500 max-w-xl">
        Naili helps homeowners get clear before they contact you. That means tighter scope, realistic expectations, and fewer wasted site visits.
       </p>

       <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
         href="#access"
         className="flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-stone-900 hover:shadow-xl active:scale-95"
        >
         Request early access
         <ArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-sm text-stone-400 text-center sm:text-left">Free during launch — no lead fees.</span>
       </div>

       {/* Stats row */}
       <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((stat) => (
         <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4 text-center shadow-sm">
          <p className="text-xl sm:text-2xl font-bold text-stone-800">{stat.value}</p>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-stone-600">{stat.label}</p>
          <p className="text-[10px] sm:text-xs text-stone-400">{stat.desc}</p>
         </div>
        ))}
       </div>
      </div>

      {/* Hero image */}
      <div className="relative order-first lg:order-last">
       <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xl">
        <Image
         src="/imagery/contractors-hero-new.jpg"
         alt="Professional contractors reviewing project details on a tablet at a modern home"
         width={1536}
         height={1024}
         className="h-full w-full object-cover"
         priority
        />
        {/* Overlay badge */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-2 shadow-lg">
         <TrendingUp className="h-4 w-4 text-emerald-600" />
         <div>
          <p className="text-xs font-semibold text-stone-800">Growing network</p>
          <p className="text-[10px] text-stone-500">Expanding region by region</p>
         </div>
        </div>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Benefits */}
   <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="mb-8 sm:mb-10 text-center">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-800">
       Why pros choose Naili
      </h2>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-stone-500 max-w-2xl mx-auto">
       Stop chasing cold leads. Get matched with homeowners who already know what they want.
      </p>
     </div>

     <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
      {BENEFITS.map((item) => (
       <div
        key={item.title}
        className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
       >
        <div className={`inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${item.color}`}>
         <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h3 className="mt-3 sm:mt-4 text-lg font-bold text-stone-800">
         {item.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.desc}</p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* How it works */}
   <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20 bg-white">
    <div className="mx-auto max-w-7xl">
     <div className="mb-8 sm:mb-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 mb-3 sm:mb-4">
       <Clock className="h-3.5 w-3.5 text-stone-400" />
       <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">How the network works</span>
      </div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-800">
       Homeowner first, contractor-ready when it matters.
      </h2>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-stone-500 max-w-2xl">
       Naili helps homeowners get clear first. The directory exists so the right pro can step in later — without losing the scope work.
      </p>
     </div>

     <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
      {STEPS.map((step) => (
       <div key={step.num} className="relative rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-white">
          <step.icon className="h-5 w-5" />
         </div>
         <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{step.num}</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-800">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.desc}</p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Current promise */}
   <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-white p-5 sm:p-8 md:p-10 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 mb-3 sm:mb-4">
       <div className="h-2 w-2 rounded-full bg-emerald-500" />
       <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Live now</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-800">
       The current promise is deliberately modest.
      </h2>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-stone-500 max-w-3xl">
       Free early access, better homeowner context, and a quieter matching model while the directory is still small.
      </p>

      <div className="mt-6 sm:mt-8 grid gap-4 sm:grid-cols-2">
       <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
         <Zap className="h-4 w-4 text-red-500" />
         <span className="text-xs font-bold uppercase tracking-wider text-stone-400">What we avoid</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-800">Marketplace spam</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
         No anonymous junk leads or broad quote blasts. The network should feel tighter and more useful than that.
        </p>
       </div>
       <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
         <Users className="h-4 w-4 text-blue-500" />
         <span className="text-xs font-bold uppercase tracking-wider text-stone-400">What homeowners feel</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-stone-800">Clear before contact</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
         Homeowners arrive with a cleaner brief, which usually means better first conversations for everyone.
        </p>
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* Prybar.ai callout */}
   <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20 bg-white">
    <div className="mx-auto max-w-7xl">
     <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-stone-800 to-stone-900 p-6 sm:p-8 md:p-10 text-white">
      <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
       <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 mb-3 sm:mb-4">
         <Sparkles className="h-3.5 w-3.5 text-amber-400" />
         <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Contractor tools</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
         Manage your business with Prybar.ai
        </h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/70 max-w-xl">
         Our companion platform for contractors. Manage bids, track projects, communicate with clients, and grow your business — all in one place.
        </p>
        <a
         href="https://www.prybar.ai"
         target="_blank"
         rel="noopener noreferrer"
         className="mt-5 sm:mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-semibold text-stone-800 shadow-lg transition hover:bg-stone-100 active:scale-95"
        >
         Explore Prybar.ai
         <ExternalLink className="h-4 w-4" />
        </a>
       </div>
       <div className="grid grid-cols-2 gap-3">
        {[
         { label: "Bid Management", desc: "Track & send bids" },
         { label: "Client Portal", desc: "Share updates easily" },
         { label: "Project Tracking", desc: "Stay organized" },
         { label: "Invoicing", desc: "Get paid faster" },
        ].map((feature) => (
         <div key={feature.label} className="rounded-xl bg-white/10 border border-white/10 p-3 sm:p-4">
          <p className="text-sm font-semibold text-white">{feature.label}</p>
          <p className="mt-0.5 text-xs text-white/60">{feature.desc}</p>
         </div>
        ))}
       </div>
      </div>
     </div>
    </div>
   </section>

   {/* FAQ */}
   <section className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20">
    <div className="mx-auto max-w-7xl">
     <div className="mb-8 sm:mb-10">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-800">
       Questions worth asking early
      </h2>
     </div>
     <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
      {CONTRACTOR_FAQS.map((faq) => (
       <div
        key={faq.question}
        className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm"
       >
        <h3 className="text-base sm:text-lg font-bold text-stone-800">
         {faq.question}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
         {faq.answer}
        </p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* CTA — Signup Form */}
   <section id="access" className="px-4 py-12 sm:px-6 sm:py-16 md:px-10 md:py-20 bg-white">
    <div className="mx-auto max-w-7xl">
     <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      {/* Left — messaging */}
      <div className="lg:sticky lg:top-28">
       <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 mb-3 sm:mb-4">
        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Early access</span>
       </div>
       <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-800">
        Ready to join the network?
       </h2>
       <p className="mt-2 sm:mt-3 text-sm sm:text-base text-stone-500 max-w-lg">
        We&apos;re building the directory region by region. Fill out the form and we&apos;ll reach out when we&apos;re active in your area.
       </p>

       <div className="mt-6 space-y-3">
        {[
         "No fees during early access",
         "We review trade & service area first",
         "Better-scoped leads from day one",
         "Access to Prybar.ai contractor tools",
        ].map((item) => (
         <div key={item} className="flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span className="text-sm text-stone-600">{item}</span>
         </div>
        ))}
       </div>
      </div>

      {/* Right — form */}
      <div className="rounded-2xl sm:rounded-3xl border border-stone-200 bg-stone-50 p-5 sm:p-6 md:p-8 shadow-sm">
       <ContractorSignupForm />
      </div>
     </div>
    </div>
   </section>

   <Footer />
  </main>
 );
}
