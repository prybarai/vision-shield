"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Inbox } from "lucide-react";
import Link from "next/link";

export default function ProHero() {
 return (
 <section className="relative pt-36 md:pt-44 pb-20 px-6 md:px-10 overflow-hidden">
 <div className="max-w-7xl mx-auto">
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7 }}
 className="flex items-center gap-2.5 mb-6"
 >
 <div className="ai-pulse" />
 <span className="mono-label !text-mint">naili · pro infrastructure</span>
 </motion.div>

 <motion.h1
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-canvas-50 leading-[1.02] max-w-4xl"
 >
 Stop chasing leads.
 <br />
 <span className="italic text-sand">Start receiving briefs.</span>
 </motion.h1>

 <motion.p
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.9, delay: 0.25 }}
 className="mt-6 text-lg md:text-xl text-canvas-50/70 max-w-2xl leading-relaxed"
 >
 Naili Pro delivers verified-scope project briefs to the contractors that
 actually fit the job. Every homeowner has already seen a concept, answered
 the clarifying questions, and signed off on the scope. No spam, just the brief.
 </motion.p>

 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8, delay: 0.4 }}
 className="mt-8 flex flex-wrap items-center gap-3"
 >
 <Link
 href="#access"
 className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full bg-sand text-graphite-700 font-medium text-sm hover:bg-sand-light transition-all hover:-translate-y-0.5 hover:shadow-glow"
 >
 Request early access
 <ArrowRight className="w-4 h-4" />
 </Link>
 <Link
 href="#brief"
 className="inline-flex items-center gap-2 py-3.5 px-6 rounded-full text-sm text-canvas-50/80 hover:text-canvas-50 border border-white/10 hover:border-white/25 transition"
 >
 Preview a lead brief
 </Link>
 </motion.div>

 {/* Feature chips */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 1, delay: 0.6 }}
 className="mt-10 flex flex-wrap gap-3"
 >
 <Chip icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Naili Verified Scope" />
 <Chip icon={<Inbox className="w-3.5 h-3.5" />} label="Delivered via Prybar Connect" />
 <Chip label="No auction. No bidding wars." />
 <Chip label="Cancel anytime" />
 </motion.div>
 </div>
 </section>
 );
}

function Chip({ icon, label }: { icon?: React.ReactNode; label: string }) {
 return (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-canvas-50/80">
 {icon}
 <span>{label}</span>
 </div>
 );
}
