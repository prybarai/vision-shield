"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
 return (
  <section className="relative overflow-hidden px-6 pb-20 pt-32 md:px-10 md:pt-40">
   <div className="absolute inset-0 -z-10">
    <div className="absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2 bg-radial-warm opacity-80" />
    <div
     className="absolute inset-0 opacity-30"
     style={{
      backgroundImage:
       "linear-gradient(rgba(124,144,176,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,144,176,0.05) 1px, transparent 1px)",
      backgroundSize: "64px 64px",
      maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
      WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
     }}
    />
   </div>

   <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[1.05fr_1fr] lg:gap-20">
    <div>
     <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="mb-6 flex items-center gap-2.5"
     >
      <div className="ai-pulse" />
      <span className="mono-label">the intelligence layer for home transformation</span>
     </motion.div>

     <motion.h1
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
      className="font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl lg:text-7xl"
     >
      See what your space
      <br />
      <span className="italic text-signature">could become</span>
      <span className="text-ink">.</span>
      <br />
      Then price the real next move.
     </motion.h1>

     <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3 }}
      className="mt-6 max-w-lg text-lg leading-relaxed text-ink-600 md:text-xl"
     >
      Upload a photo. Naili turns it into a visual concept, a scoped plan,
      and a grounded next step, whether that means DIY or bringing in the
      right pro.
     </motion.p>

     <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.45 }}
      className="mt-8 flex flex-wrap items-center gap-3"
     >
      <Link href="#upload" className="btn-primary">
       Upload Your Space
       <ArrowRight className="w-4 h-4" />
      </Link>
      <Link href="#how" className="btn-ghost">
       <Play className="w-3.5 h-3.5 fill-ink" />
       See how it works
      </Link>
     </motion.div>

     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.7 }}
      className="mt-10 flex flex-wrap items-center gap-3"
     >
      <TruthChip label="Real photo upload" />
      <TruthChip label="ZIP-adjusted estimate" />
      <TruthChip label="Contractor-ready brief" />
      <TruthChip label="Optional concept render" />
     </motion.div>
    </div>

    <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 1.1, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
     className="relative"
    >
     <HeroPreview />
    </motion.div>
   </div>
  </section>
 );
}

function TruthChip({ label }: { label: string }) {
 return (
  <div className="inline-flex items-center gap-2 rounded-full border border-panel bg-canvas-50/80 px-3 py-1.5 text-xs text-ink-600">
   <span className="h-1.5 w-1.5 rounded-full bg-mint" />
   <span>{label}</span>
  </div>
 );
}

function HeroPreview() {
 return (
  <div className="relative">
   <div className="pointer-events-none absolute -inset-10 rounded-full bg-sand/20 blur-3xl" />

   <div
    className="relative aspect-[4/3.2] overflow-hidden rounded-3xl bg-graphite-700"
    style={{ boxShadow: "0 40px 80px rgba(23,24,28,0.20), 0 0 0 1px rgba(23,24,28,0.08)" }}
   >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
     src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"
     alt="Illustrative room before"
     className="absolute inset-0 h-full w-full object-cover"
     draggable={false}
    />

    <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
     {/* eslint-disable-next-line @next/next/no-img-element */}
     <img
      src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80"
      alt="Illustrative room after"
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
     />
     <div className="absolute inset-0 bg-gradient-to-br from-sand/15 via-transparent to-mint/10" />
    </div>

    <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-graphite-700/80 px-2.5 py-1.5 backdrop-blur-md">
     <span className="mono-label !text-canvas-50">illustrative product preview</span>
    </div>

    <div className="absolute left-3 top-3">
     <span className="mono-label rounded bg-graphite-700/70 px-2 py-1 !text-canvas-50 backdrop-blur">example current</span>
    </div>
    <div className="absolute right-3 top-3">
     <span className="mono-label rounded bg-sand/90 px-2 py-1 !text-ink backdrop-blur">example vision</span>
    </div>

    <div className="absolute inset-0 overflow-hidden pointer-events-none">
     <div className="scan-line animate-scan-sweep" />
    </div>

    <div className="absolute bottom-0 top-0 left-1/2 w-px bg-canvas-50/80 shadow-[0_0_12px_rgba(251,248,244,0.7)]" />
    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-canvas-50 shadow-lift">
     <div className="flex gap-0.5 text-ink">
      <svg width="6" height="10" viewBox="0 0 8 12" fill="currentColor">
       <path d="M7 1L1 6l6 5V1z" />
      </svg>
      <svg width="6" height="10" viewBox="0 0 8 12" fill="currentColor">
       <path d="M1 1l6 5-6 5V1z" />
      </svg>
     </div>
    </div>
   </div>
  </div>
 );
}
