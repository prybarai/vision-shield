"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
 Hammer, HardHat, Bookmark, ArrowRight, Users, TrendingUp,
} from "lucide-react";
import MaterialsCart from "./MaterialsCart";
import type { SavedProject } from "@/lib/useProjectStorage";

interface Props {
 difficultyScore: number; // 1-10
 costLow: number;
 costHigh: number;
 timeline: string;
 onSave: () => void;
 saved?: boolean;
}

export default function ProjectFateCard({
 difficultyScore, costLow, costHigh, timeline, onSave, saved,
}: Props) {
 const isPro = difficultyScore > 6;
 const [confirmedSave, setConfirmedSave] = useState(saved ?? false);

 return (
 <div className="w-full max-w-5xl mx-auto">
 <div className="flex items-end justify-between mb-5">
 <div>
 <span className="mono-label">step 04 · naili's recommendation</span>
 <h3 className="font-display text-3xl md:text-4xl text-ink mt-1 tracking-tight">
 {isPro ? "Worth handing to the pros." : "You've got this."}
 </h3>
 <p className="text-ink-600 text-sm mt-1.5 max-w-lg">
 {isPro
 ? "This project likely involves higher precision, code-sensitive work, or specialized installation."
 : "Approachable if you're comfortable with light demo, prep, and finish work."}
 </p>
 </div>
 <ConfidenceGauge score={difficultyScore} />
 </div>

 <div className="grid md:grid-cols-2 gap-4">
 {/* DIY panel */}
 <PathCard
 active={!isPro}
 icon={<Hammer className="w-5 h-5" />}
 eyebrow="DIY Hero Path"
 title="Weekend Warrior"
 rationale="Paint, prep, and minor finish work. No permits expected."
 cta={!isPro ? "Unlock the Shopping List" : "See DIY breakdown"}
 />

 {/* Pro panel */}
 <PathCard
 active={isPro}
 icon={<HardHat className="w-5 h-5" />}
 eyebrow="Pro Path"
 title="Local Legends"
 rationale="Plumbing, electrical, or tile work recommends a licensed pro."
 cta={isPro ? "Meet Your Matched Pros" : "Request pro quote anyway"}
 variant="pro"
 />
 </div>

 {/* Cost + Timeline band */}
 <div className="mt-4 glass-warm rounded-2xl p-5 flex flex-wrap gap-6 justify-between items-center">
 <div>
 <span className="mono-label">estimated range</span>
 <div className="font-display text-2xl md:text-3xl text-ink tracking-tight mt-1 tabular-nums">
 ${costLow.toLocaleString()} – ${costHigh.toLocaleString()}
 </div>
 </div>
 <div>
 <span className="mono-label">timeline band</span>
 <div className="font-display text-2xl md:text-3xl text-ink tracking-tight mt-1">
 {timeline}
 </div>
 </div>
 <div className="flex items-center gap-2 text-sm text-ink-600">
 <TrendingUp className="w-4 h-4 text-sand-dark" />
 <span>Lumber in 95112 is up <span className="text-ink font-medium">2%</span> this week</span>
 </div>
 </div>

 {/* DIY materials cart */}
 {!isPro && <MaterialsCart />}

 {/* Pro matching preview */}
 {isPro && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.3 }}
 className="mt-4 glass-warm rounded-2xl p-5"
 >
 <div className="flex items-center gap-2.5 mb-4">
 <Users className="w-4 h-4 text-ink-600" />
 <span className="mono-label">matched local legends</span>
 </div>
 <div className="space-y-3">
 {[
 { name: "Ridge & Bloom Co.", rating: 4.9, reviews: 128, tag: "tile · flooring" },
 { name: "Hearthline Builders", rating: 4.8, reviews: 94, tag: "bath renos" },
 { name: "Solace Design-Build", rating: 4.9, reviews: 211, tag: "full remodel" },
 ].map((p) => (
 <div
 key={p.name}
 className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-canvas-200/60 transition"
 >
 <div>
 <p className="font-medium text-ink">{p.name}</p>
 <span className="mono-label">{p.tag}</span>
 </div>
 <div className="flex items-center gap-4">
 <span className="text-sm text-ink-600 tabular-nums">
 ★ {p.rating}
 <span className="text-ink-500"> · {p.reviews}</span>
 </span>
 <button className="btn-ghost !py-1.5 !px-3 text-xs">
 Send brief <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}

 {/* Save to Vision Board */}
 <motion.button
 onClick={() => { onSave(); setConfirmedSave(true); }}
 whileHover={{ y: -1 }}
 whileTap={{ scale: 0.98 }}
 className={cn(
 "mt-5 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border border-dashed transition-all duration-300",
 confirmedSave
 ? "bg-mint/20 border-mint/50 text-ink"
 : "border-panel text-ink-600 hover:border-ink/30 hover:text-ink hover:bg-canvas-50/60"
 )}
 >
 <Bookmark className={cn("w-4 h-4", confirmedSave && "fill-ink")} />
 <span className="font-medium">
 {confirmedSave ? "Saved to your Vision Board" : "Save this plan to my Vision Board"}
 </span>
 </motion.button>
 </div>
 );
}

function PathCard({
 active, icon, eyebrow, title, rationale, cta, variant,
}: {
 active: boolean;
 icon: React.ReactNode;
 eyebrow: string;
 title: string;
 rationale: string;
 cta: string;
 variant?: "pro";
}) {
 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 whileHover={{ y: -2 }}
 className={cn(
 "relative rounded-3xl p-6 border transition-all duration-500 overflow-hidden",
 active
 ? "bg-ink text-canvas-50 border-ink shadow-lift"
 : "glass-warm text-ink border-hairline opacity-70 hover:opacity-100"
 )}
 >
 {/* Ambient glow if active */}
 {active && (
 <div className={cn(
 "absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-40",
 variant === "pro" ? "bg-slate-smart" : "bg-sand"
 )} />
 )}

 <div className="flex items-start justify-between mb-4 relative">
 <div className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center",
 active ? "bg-white/10" : "bg-canvas-200"
 )}>
 {icon}
 </div>
 {active && (
 <span className="mono-label !text-mint">naili recommends</span>
 )}
 </div>

 <div className="relative">
 <span className={cn("mono-label", active ? "!text-canvas-50/50" : "")}>
 {eyebrow}
 </span>
 <h4 className="font-display text-2xl tracking-tight mt-1 mb-2">{title}</h4>
 <p className={cn("text-sm mb-5", active ? "text-canvas-50/70" : "text-ink-600")}>
 {rationale}
 </p>

 <button className={cn(
 "inline-flex items-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
 active
 ? "bg-canvas-50 text-ink hover:bg-canvas hover:shadow-glow"
 : "bg-transparent text-ink border border-panel hover:bg-canvas-200"
 )}>
 {cta}
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </motion.div>
 );
}

function ConfidenceGauge({ score }: { score: number }) {
 const pct = (score / 10) * 100;
 return (
 <div className="hidden md:block">
 <span className="mono-label">difficulty</span>
 <div className="flex items-center gap-3 mt-1">
 <div className="w-28 h-1.5 rounded-full bg-ink/10 overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${pct}%` }}
 transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
 className="h-full bg-gradient-to-r from-mint via-sand to-sand-dark"
 />
 </div>
 <span className="font-display text-xl text-ink tabular-nums">{score}<span className="text-ink-500 text-sm">/10</span></span>
 </div>
 </div>
 );
}
