"use client";

import { motion } from "framer-motion";
import { Camera, ScanLine, Sparkles, Route } from "lucide-react";

const STEPS = [
 {
 icon: Camera,
 eyebrow: "01 · capture",
 title: "Upload the space.",
 copy: "A single photo is all Naili needs to begin reading the room.",
 },
 {
 icon: ScanLine,
 eyebrow: "02 · scan",
 title: "Naili reads surfaces.",
 copy: "Walls, fixtures, floors, lighting — the engine identifies every material in seconds.",
 },
 {
 icon: Sparkles,
 eyebrow: "03 · envision",
 title: "A concept emerges.",
 copy: "Your mood choices shape a visual that feels designed for the way you actually live.",
 },
 {
 icon: Route,
 eyebrow: "04 · decide",
 title: "A realistic next move.",
 copy: "DIY shopping list or matched pros — delivered with a verified scope and timeline.",
 },
];

export default function HowItWorks() {
 return (
 <section id="how" className="section relative">
 <div className="max-w-7xl mx-auto">
 <div className="max-w-2xl mb-14">
 <span className="mono-label">how naili works</span>
 <h2 className="font-display text-4xl md:text-5xl tracking-tight text-ink mt-2 leading-[1.05]">
 A quiet, intelligent system — not a quote form.
 </h2>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {STEPS.map((step, i) => {
 const Icon = step.icon;
 return (
 <motion.div
 key={step.eyebrow}
 initial={{ opacity: 0, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-10% 0px" }}
 transition={{ duration: 0.7, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
 className="group relative rounded-3xl p-6 bg-canvas-50 border border-hairline hover:border-panel transition-all duration-500 hover:-translate-y-1 hover:shadow-lift overflow-hidden"
 >
 {/* Hover glow */}
 <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-sand/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

 <div className="relative">
 <div className="w-11 h-11 rounded-xl bg-ink/5 flex items-center justify-center mb-5 group-hover:bg-ink group-hover:text-canvas-50 transition-colors duration-500">
 <Icon className="w-5 h-5" />
 </div>
 <span className="mono-label">{step.eyebrow}</span>
 <h3 className="font-display text-2xl text-ink mt-1.5 mb-2 tracking-tight">
 {step.title}
 </h3>
 <p className="text-ink-600 text-sm leading-relaxed">
 {step.copy}
 </p>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>
 </section>
 );
}
