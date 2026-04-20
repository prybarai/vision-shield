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
      className="font-display text-5xl leading-[1.02] tracking-tight text-gray-900 md:text-6xl lg:text-7xl"
     >
      The AI that understands
      <br />
      <span className="italic text-signature bg-gradient-to-r from-sand-dark to-sand bg-clip-text text-transparent">your home</span>
      <span className="text-gray-900">.</span>
      <br />
      <span className="text-gray-700">Diagnose, plan, price—then DIY or hire.</span>
     </motion.h1>

     <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3 }}
      className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600 md:text-xl"
     >
      Upload a photo of your space. Our AI analyzes what's visible, creates a realistic renovation plan with cost estimates, material lists, and visual concepts—then helps you decide between DIY or hiring a pro.
     </motion.p>

     <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.45 }}
      className="mt-8 flex flex-wrap items-center gap-3"
     >
      <Link href="#upload" className="btn-primary bg-gradient-to-r from-sand-dark to-sand border-0 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all">
       Start your transformation
       <ArrowRight className="w-5 h-5 ml-2" />
      </Link>
      <Link href="#how" className="btn-ghost border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900">
       <Play className="w-3.5 h-3.5 fill-gray-700" />
       See examples
      </Link>
     </motion.div>

     <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.7 }}
      className="mt-10 flex flex-wrap items-center gap-3"
     >
      <TruthChip label="Any home project" />
      <TruthChip label="AI diagnosis" />
      <TruthChip label="DIY vs Pro options" />
      <TruthChip label="Materials + pricing" />
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
  <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
   <span className="h-2 w-2 rounded-full bg-green-500" />
   <span>{label}</span>
  </div>
 );
}

function HeroPreview() {
 return (
  <div className="relative">
   <div className="pointer-events-none absolute -inset-10 rounded-full bg-sand/20 blur-3xl" />

   <div
    className="relative aspect-[4/3.2] overflow-hidden rounded-3xl bg-graphite-700 p-8"
    style={{ boxShadow: "0 40px 80px rgba(23,24,28,0.20), 0 0 0 1px rgba(23,24,28,0.08)" }}
   >
    <div className="flex flex-col h-full items-center justify-center text-center text-canvas-50">
     <div className="mb-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sand/20 to-mint/20 px-4 py-2 mb-4">
       <span className="text-sm font-semibold text-sand-light">How it works</span>
      </div>
      <h3 className="text-2xl font-bold mb-3">Photo → AI Analysis → Complete Plan</h3>
     </div>
     
     <div className="grid grid-cols-3 gap-4 w-full max-w-md">
      <div className="flex flex-col items-center">
       <div className="w-12 h-12 rounded-full bg-graphite-600 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-sand">1</span>
       </div>
       <span className="text-sm font-medium">Upload photo</span>
      </div>
      
      <div className="flex flex-col items-center">
       <div className="w-12 h-12 rounded-full bg-graphite-600 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-sand">2</span>
       </div>
       <span className="text-sm font-medium">AI analyzes</span>
      </div>
      
      <div className="flex flex-col items-center">
       <div className="w-12 h-12 rounded-full bg-graphite-600 flex items-center justify-center mb-2">
        <span className="text-lg font-bold text-sand">3</span>
       </div>
       <span className="text-sm font-medium">Get your plan</span>
      </div>
     </div>
     
     <div className="mt-8 text-sm text-canvas-50/70 max-w-md">
      <p>Our AI examines your photo, understands the space, and creates a complete renovation plan with estimates, materials, and visual concepts.</p>
     </div>
     
     <div className="mt-6 rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <span className="mono-label !text-canvas-50/80">No misleading examples — real AI analysis</span>
     </div>
    </div>
   </div>
  </div>
 );
}