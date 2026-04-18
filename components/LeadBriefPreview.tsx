"use client";

import { motion } from "framer-motion";
import {
 ShieldCheck, MapPin, Clock, Ruler, Camera, MessageSquare,
 ArrowUpRight, Mail, CheckCircle2,
} from "lucide-react";

export default function LeadBriefPreview() {
 return (
 <section id="brief" className="section relative">
 <div className="max-w-7xl mx-auto">
 <div className="max-w-2xl mb-12">
 <span className="mono-label !text-mint">the brief</span>
 <h2 className="font-display text-4xl md:text-5xl tracking-tight text-canvas-50 mt-2 leading-[1.05]">
 What arrives in your inbox.
 </h2>
 <p className="text-canvas-50/60 mt-4 max-w-xl">
 Every brief is a pre-qualified project the homeowner has already
 visually agreed to. No "can you ballpark it?" — just scope, photo,
 intent, timeline.
 </p>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-10% 0px" }}
 transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
 className="relative"
 >
 {/* Outer glow */}
 <div className="absolute -inset-6 bg-sand/10 blur-3xl rounded-3xl pointer-events-none" />

 <div className="relative glass-dark rounded-3xl overflow-hidden">
 {/* Brief header bar */}
 <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-white/5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-mint/20 border border-mint/40 flex items-center justify-center">
 <ShieldCheck className="w-4 h-4 text-mint" />
 </div>
 <div>
 <span className="mono-label !text-mint">naili verified scope</span>
 <p className="text-sm text-canvas-50">Brief #NB-24-0142 · Bathroom Refresh</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs text-canvas-50/50 tabular-nums hidden md:inline">delivered 04:12pm</span>
 <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand text-graphite-700 text-xs font-medium hover:bg-sand-light transition">
 Accept <ArrowUpRight className="w-3 h-3" />
 </button>
 </div>
 </div>

 {/* Body: photo + data */}
 <div className="grid md:grid-cols-[1.1fr_1fr]">
 {/* Left — source photo */}
 <div className="relative border-r border-white/5">
 <div className="relative aspect-[4/3] bg-graphite-800 overflow-hidden">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1000&q=80"
 alt="Source photo from homeowner"
 className="absolute inset-0 w-full h-full object-cover opacity-95"
 />
 {/* Photo overlays */}
 <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-graphite-700/80 backdrop-blur border border-white/10">
 <Camera className="w-3 h-3 text-canvas-50" />
 <span className="mono-label !text-canvas-50">source photo · unedited</span>
 </div>

 {/* Material tags pinned in */}
 <TagDot label="tile" x="24%" y="68%" />
 <TagDot label="vanity" x="52%" y="52%" />
 <TagDot label="lighting" x="72%" y="20%" />
 </div>

 {/* Naili concept thumbnail below */}
 <div className="p-4 flex items-center gap-3 bg-graphite-800/60">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=200&q=80"
 alt="Naili concept"
 className="w-14 h-14 rounded-lg object-cover border border-white/10"
 />
 <div className="flex-1 min-w-0">
 <span className="mono-label !text-canvas-50/50">naili concept the homeowner approved</span>
 <p className="text-sm text-canvas-50 truncate">Spa Calm · Organic Minimal</p>
 </div>
 </div>
 </div>

 {/* Right — data panel */}
 <div className="p-5 md:p-6 space-y-5">
 <DataRow
 icon={<MessageSquare className="w-3.5 h-3.5" />}
 label="homeowner intent"
 >
 Replace tile with LVP, refresh vanity, keep window placement.
 </DataRow>

 <DataRow
 icon={<CheckCircle2 className="w-3.5 h-3.5 text-mint" />}
 label="verified scope flags"
 >
 <div className="flex flex-wrap gap-1.5 mt-1">
 <Flag>Minor patch + paint</Flag>
 <Flag>Replace existing floor</Flag>
 <Flag>Pros do everything</Flag>
 </div>
 </DataRow>

 <div className="grid grid-cols-2 gap-4">
 <DataRow icon={<Ruler className="w-3.5 h-3.5" />} label="sqft">
 <span className="font-display text-xl text-canvas-50">~84 sqft</span>
 </DataRow>
 <DataRow icon={<Clock className="w-3.5 h-3.5" />} label="homeowner timeline">
 <span className="font-display text-xl text-canvas-50">2–4 weeks</span>
 </DataRow>
 </div>

 <DataRow icon={<MapPin className="w-3.5 h-3.5" />} label="location">
 <span className="text-canvas-50">Willow Glen · 95125</span>
 </DataRow>

 {/* Scope confidence bar */}
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <span className="mono-label !text-canvas-50/50">scope confidence</span>
 <span className="text-sm text-mint tabular-nums">94%</span>
 </div>
 <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 whileInView={{ width: "94%" }}
 viewport={{ once: true }}
 transition={{ duration: 1, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
 className="h-full bg-gradient-to-r from-mint via-sand to-sand-dark"
 />
 </div>
 </div>

 {/* Contact teaser */}
 <div className="mt-3 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-canvas-50/50">
 <Mail className="w-3.5 h-3.5" />
 <span>Homeowner contact unlocks on accept</span>
 </div>
 </div>
 </div>

 {/* Footer strip */}
 <div className="px-5 md:px-7 py-3 border-t border-white/5 flex items-center justify-between text-xs text-canvas-50/40">
 <span>delivered securely via prybar connect</span>
 <div className="flex items-center gap-2">
 <div className="ai-pulse" />
 <span>naili engine v2.0</span>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Explainer card beneath */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.7, delay: 0.3 }}
 className="mt-8 p-6 rounded-3xl bg-graphite-800/50 border border-white/5"
 >
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-xl bg-mint/10 border border-mint/30 flex items-center justify-center shrink-0">
 <ShieldCheck className="w-5 h-5 text-mint" />
 </div>
 <div>
 <h3 className="font-display text-xl text-canvas-50 tracking-tight">
 What "Naili Verified Scope" actually means.
 </h3>
 <p className="text-canvas-50/60 text-sm leading-relaxed mt-1 max-w-3xl">
 Every brief includes a scope of work the homeowner has already
 visually agreed to. They've seen a concept, answered three scope
 clarifications, and chosen a direction. You never hear "I just
 want a ballpark" on a Naili call.
 </p>
 </div>
 </div>
 </motion.div>
 </div>
 </section>
 );
}

function DataRow({
 icon, label, children,
}: {
 icon: React.ReactNode;
 label: string;
 children: React.ReactNode;
}) {
 return (
 <div>
 <div className="flex items-center gap-1.5 text-canvas-50/50 mb-1">
 {icon}
 <span className="mono-label !text-canvas-50/50">{label}</span>
 </div>
 <div className="text-sm text-canvas-50/90">{children}</div>
 </div>
 );
}

function Flag({ children }: { children: React.ReactNode }) {
 return (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/10 border border-mint/30 text-xs text-mint">
 <CheckCircle2 className="w-2.5 h-2.5" />
 {children}
 </span>
 );
}

function TagDot({ label, x, y }: { label: string; x: string; y: string }) {
 return (
 <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
 <div className="relative">
 <div className="w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_12px_rgba(184,216,200,0.9)]" />
 <div className="absolute top-4 left-4 px-2 py-0.5 rounded bg-graphite-700/90 backdrop-blur border border-mint/30 whitespace-nowrap">
 <span className="text-[9px] font-mono tracking-wider uppercase text-mint">{label}</span>
 </div>
 </div>
 </div>
 );
}
