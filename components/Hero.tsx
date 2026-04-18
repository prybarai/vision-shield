"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
 return (
 <section className="relative pt-32 md:pt-40 pb-20 px-6 md:px-10 overflow-hidden">
 {/* Layered ambient lighting */}
 <div className="absolute inset-0 -z-10">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[100%] bg-radial-warm opacity-80" />
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

 <div className="max-w-7xl mx-auto grid md:grid-cols-[1.05fr_1fr] gap-12 lg:gap-20 items-center">
 {/* Left — copy */}
 <div>
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, delay: 0.1 }}
 className="flex items-center gap-2.5 mb-6"
 >
 <div className="ai-pulse" />
 <span className="mono-label">the intelligence layer for home transformation</span>
 </motion.div>

 <motion.h1
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-ink leading-[1.02]"
 >
 See what your space
 <br />
 <span className="italic text-signature">could become</span>
 <span className="text-ink">—</span>
 <br />
 before you spend a dollar.
 </motion.h1>

 <motion.p
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.9, delay: 0.3 }}
 className="mt-6 text-lg md:text-xl text-ink-600 max-w-lg leading-relaxed"
 >
 Upload a photo. Naili turns it into a visual concept, a scoped plan,
 and a realistic next move — whether that means DIY or bringing in the
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
 See a live demo
 </Link>
 </motion.div>

 {/* Proof strip */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 1, delay: 0.7 }}
 className="mt-10 flex items-center gap-6"
 >
 <div>
 <div className="font-display text-2xl text-ink tabular-nums">14,200+</div>
 <span className="mono-label">spaces scanned</span>
 </div>
 <div className="h-8 w-px bg-panel" />
 <div>
 <div className="font-display text-2xl text-ink tabular-nums">$1.8M</div>
 <span className="mono-label">saved on quotes</span>
 </div>
 <div className="h-8 w-px bg-panel" />
 <div>
 <div className="font-display text-2xl text-ink tabular-nums">94%</div>
 <span className="mono-label">scope accuracy</span>
 </div>
 </motion.div>
 </div>

 {/* Right — interface preview */}
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

/**
 * HeroPreview — a static-but-alive mock of the naili interface.
 * Shows the split-screen reveal, stat cards, and ambient scan activity.
 */
function HeroPreview() {
 return (
 <div className="relative">
 {/* Outer glow halo */}
 <div className="absolute -inset-10 bg-sand/20 blur-3xl rounded-full pointer-events-none" />

 {/* Main frame */}
 <div
 className="relative rounded-3xl overflow-hidden bg-graphite-700 aspect-[4/3.2]"
 style={{ boxShadow: "0 40px 80px rgba(23,24,28,0.20), 0 0 0 1px rgba(23,24,28,0.08)" }}
 >
 {/* Base "current" photo */}
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80"
 alt="A bathroom before"
 className="absolute inset-0 w-full h-full object-cover"
 draggable={false}
 />
 {/* Concept — right side */}
 <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 50%)" }}>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80"
 alt="A bathroom after"
 className="absolute inset-0 w-full h-full object-cover"
 draggable={false}
 />
 <div className="absolute inset-0 bg-gradient-to-br from-sand/15 via-transparent to-mint/10" />
 </div>

 {/* Divider */}
 <div className="absolute top-0 bottom-0 left-1/2 w-px bg-canvas-50/80 shadow-[0_0_12px_rgba(251,248,244,0.7)]" />
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-canvas-50 shadow-lift flex items-center justify-center">
 <div className="flex gap-0.5 text-ink">
 <svg width="6" height="10" viewBox="0 0 8 12" fill="currentColor">
 <path d="M7 1L1 6l6 5V1z" />
 </svg>
 <svg width="6" height="10" viewBox="0 0 8 12" fill="currentColor">
 <path d="M1 1l6 5-6 5V1z" />
 </svg>
 </div>
 </div>

 {/* Labels */}
 <div className="absolute top-3 left-3">
 <span className="mono-label !text-canvas-50 bg-graphite-700/70 backdrop-blur px-2 py-1 rounded">
 current
 </span>
 </div>
 <div className="absolute top-3 right-3">
 <span className="mono-label !text-ink bg-sand/90 backdrop-blur px-2 py-1 rounded">
 naili vision
 </span>
 </div>

 {/* Live scan line */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="scan-line animate-scan-sweep" />
 </div>

 {/* Floating engine badge */}
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.6, delay: 1 }}
 className="absolute bottom-3 left-3 flex items-center gap-2 bg-graphite-700/80 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10"
 >
 <div className="ai-pulse" />
 <span className="mono-label !text-canvas-50">naili engine · live</span>
 </motion.div>
 </div>

 {/* Floating stat card — top right */}
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, delay: 0.8 }}
 className="absolute -top-3 -right-3 md:-right-5 glass-warm rounded-2xl p-3.5 w-44 hidden sm:block animate-float"
 >
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-1.5 h-1.5 rounded-full bg-mint" />
 <span className="mono-label">confidence</span>
 </div>
 <div className="font-display text-2xl text-ink tabular-nums">94%</div>
 <div className="text-xs text-ink-500 mt-0.5">Scope match · verified</div>
 </motion.div>

 {/* Floating stat card — bottom left */}
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, delay: 1.1 }}
 className="absolute -bottom-5 -left-3 md:-left-6 glass-warm rounded-2xl p-3.5 w-52 hidden sm:block"
 >
 <span className="mono-label">estimated range</span>
 <div className="font-display text-xl text-ink tabular-nums mt-0.5">
 $480 – $1,450
 </div>
 <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
 <span>1 weekend</span>
 <span>·</span>
 <span className="text-sand-dark">DIY viable</span>
 </div>
 </motion.div>
 </div>
 );
}
