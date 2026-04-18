"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Ruler, Layers, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

export type RevealPhase = "scanning" | "tagging" | "revealing" | "complete";

interface VisionRevealProps {
 photoUrl: string;
 conceptUrl: string;
 description: string;
 onComplete?: () => void;
}

const SCAN_TAGS = [
 { label: "wall", x: "22%", y: "30%", delay: 0.4 },
 { label: "floor", x: "58%", y: "74%", delay: 0.7 },
 { label: "vanity", x: "46%", y: "58%", delay: 1.0 },
 { label: "lighting", x: "72%", y: "18%", delay: 1.3 },
 { label: "tile", x: "30%", y: "66%", delay: 1.6 },
];

export default function VisionReveal({
 photoUrl,
 conceptUrl,
 description,
 onComplete,
}: VisionRevealProps) {
 const [phase, setPhase] = useState<RevealPhase>("scanning");
 const [sliderPos, setSliderPos] = useState(50);
 const containerRef = useRef<HTMLDivElement>(null);
 const isDragging = useRef(false);

 // Phase progression
 useEffect(() => {
 const t1 = setTimeout(() => setPhase("tagging"), 1200);
 const t2 = setTimeout(() => setPhase("revealing"), 2800);
 const t3 = setTimeout(() => {
 setPhase("complete");
 onComplete?.();
 }, 4200);
 return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
 }, [onComplete]);

 // User-gesture sound
 useEffect(() => {
 const playScanSound = () => {
 try {
 const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
 const o = ctx.createOscillator();
 const g = ctx.createGain();
 o.connect(g); g.connect(ctx.destination);
 o.type = "sine";
 o.frequency.setValueAtTime(180, ctx.currentTime);
 o.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.6);
 g.gain.setValueAtTime(0.0001, ctx.currentTime);
 g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.05);
 g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
 o.start(); o.stop(ctx.currentTime + 0.85);
 } catch { /* silent fail — some browsers block it */ }
 };
 // The upload click is the user gesture; this fires shortly after.
 const t = setTimeout(playScanSound, 200);
 return () => clearTimeout(t);
 }, []);

 // Slider drag
 const updateSlider = (clientX: number) => {
 if (!containerRef.current) return;
 const rect = containerRef.current.getBoundingClientRect();
 const pct = ((clientX - rect.left) / rect.width) * 100;
 setSliderPos(Math.max(0, Math.min(100, pct)));
 };
 const onPointerDown = (e: React.PointerEvent) => {
 isDragging.current = true;
 (e.target as HTMLElement).setPointerCapture(e.pointerId);
 updateSlider(e.clientX);
 };
 const onPointerMove = (e: React.PointerEvent) => {
 if (!isDragging.current) return;
 updateSlider(e.clientX);
 };
 const onPointerUp = () => { isDragging.current = false; };

 return (
 <div className="relative w-full max-w-5xl mx-auto">
 {/* Phase label — mono annotation */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2.5">
 <div className="ai-pulse" />
 <span className="mono-label">
 {phase === "scanning" && "reading surfaces…"}
 {phase === "tagging" && "detecting materials…"}
 {phase === "revealing" && "building your project model…"}
 {phase === "complete" && "naili vision ready"}
 </span>
 </div>
 <span className="mono-label hidden md:inline">engine v2.0 · {description.slice(0, 40)}</span>
 </div>

 {/* The main stage */}
 <div
 ref={containerRef}
 className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-graphite-700 select-none"
 style={{ boxShadow: "0 40px 80px rgba(23,24,28,0.18), 0 0 0 1px rgba(23,24,28,0.08)" }}
 >
 {/* Base layer — original photo always visible */}
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={photoUrl}
 alt="Your space"
 draggable={false}
 className="absolute inset-0 w-full h-full object-cover"
 />

 {/* Concept layer — revealed via slider clip */}
 <AnimatePresence>
 {(phase === "revealing" || phase === "complete") && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
 className="absolute inset-0"
 style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={conceptUrl}
 alt="Naili Vision concept"
 draggable={false}
 className="absolute inset-0 w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-br from-sand/10 via-transparent to-mint/10" />
 </motion.div>
 )}
 </AnimatePresence>

 {/* LIDAR grid overlay — during scan */}
 <AnimatePresence>
 {(phase === "scanning" || phase === "tagging") && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.4 }}
 className="absolute inset-0 pointer-events-none"
 >
 {/* Grid */}
 <div
 className="absolute inset-0 opacity-60 mix-blend-screen"
 style={{
 backgroundImage: `
 linear-gradient(rgba(184,216,200,0.35) 1px, transparent 1px),
 linear-gradient(90deg, rgba(184,216,200,0.35) 1px, transparent 1px)
 `,
 backgroundSize: "40px 40px",
 maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
 WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
 }}
 />
 {/* Sweeping scan line */}
 <div className="absolute inset-0 overflow-hidden">
 <div className="scan-line animate-scan-sweep" />
 </div>
 {/* Vignette dimming */}
 <div className="absolute inset-0 bg-graphite-800/30" />
 </motion.div>
 )}
 </AnimatePresence>

 {/* Detected material tags */}
 <AnimatePresence>
 {phase === "tagging" &&
 SCAN_TAGS.map((tag) => (
 <motion.div
 key={tag.label}
 initial={{ opacity: 0, scale: 0.6 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.6 }}
 transition={{ delay: tag.delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
 className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
 style={{ left: tag.x, top: tag.y }}
 >
 <div className="relative">
 <div className="w-3 h-3 rounded-full bg-mint shadow-[0_0_16px_rgba(184,216,200,0.9)]" />
 <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full border border-mint animate-ping opacity-60" />
 <div className="absolute top-5 left-5 px-2.5 py-1 rounded-md bg-graphite-700/90 backdrop-blur border border-mint/30">
 <span className="text-[10px] font-mono tracking-wider uppercase text-mint">
 {tag.label}
 </span>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>

 {/* Before/After slider handle */}
 {(phase === "revealing" || phase === "complete") && (
 <>
 {/* Draggable track */}
 <div
 onPointerDown={onPointerDown}
 onPointerMove={onPointerMove}
 onPointerUp={onPointerUp}
 className="absolute inset-0 cursor-ew-resize z-20"
 />
 {/* Divider line */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3 }}
 className="absolute top-0 bottom-0 w-px bg-canvas-50/90 shadow-[0_0_12px_rgba(251,248,244,0.8)] z-10 pointer-events-none"
 style={{ left: `${sliderPos}%` }}
 />
 {/* Handle */}
 <motion.div
 initial={{ opacity: 0, scale: 0.7 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.4, duration: 0.5 }}
 className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
 style={{ left: `${sliderPos}%` }}
 >
 <div className="relative -translate-x-1/2">
 <div className="w-12 h-12 rounded-full bg-canvas-50 shadow-lift flex items-center justify-center border border-sand/60">
 <div className="flex items-center gap-0.5 text-ink">
 <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
 <path d="M7 1L1 6l6 5V1z" />
 </svg>
 <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
 <path d="M1 1l6 5-6 5V1z" />
 </svg>
 </div>
 </div>
 <div className="absolute -inset-2 rounded-full border border-sand/40 animate-pulse-soft -z-10" />
 </div>
 </motion.div>

 {/* Labels */}
 <motion.div
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.5 }}
 className="absolute top-4 left-4 z-10 pointer-events-none"
 >
 <span className="mono-label !text-canvas-50 bg-graphite-700/70 backdrop-blur px-2.5 py-1 rounded">
 current
 </span>
 </motion.div>
 <motion.div
 initial={{ opacity: 0, x: 8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.5 }}
 className="absolute top-4 right-4 z-10 pointer-events-none"
 >
 <span className="mono-label !text-ink bg-sand/90 backdrop-blur px-2.5 py-1 rounded">
 naili vision
 </span>
 </motion.div>
 </>
 )}

 {/* Vignette */}
 <div className="absolute inset-0 pointer-events-none" style={{
 boxShadow: "inset 0 0 120px rgba(0,0,0,0.25)"
 }} />
 </div>

 {/* Floating stat cards */}
 <AnimatePresence>
 {phase === "complete" && (
 <motion.div
 className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
 initial="hidden"
 animate="visible"
 variants={{
 visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
 }}
 >
 <StatCard icon={<Layers className="w-4 h-4" />} label="Materials Identified" value="12" />
 <StatCard icon={<Clock className="w-4 h-4" />} label="Labor Hours Saved" value="18" />
 <StatCard icon={<Gauge className="w-4 h-4" />} label="Naili Confidence" value="94%" accent="mint" />
 <StatCard icon={<Ruler className="w-4 h-4" />} label="Sqft Estimated" value="84" />
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

function StatCard({
 icon, label, value, accent,
}: {
 icon: React.ReactNode;
 label: string;
 value: string;
 accent?: "mint" | "sand";
}) {
 return (
 <motion.div
 variants={{
 hidden: { opacity: 0, y: 12 },
 visible: { opacity: 1, y: 0 },
 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 className="glass-warm rounded-2xl p-4 relative overflow-hidden group"
 >
 <div className={cn(
 "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
 accent === "mint" ? "bg-mint" : "bg-sand"
 )} />
 <div className="flex items-center gap-2 mb-2">
 <span className="text-ink-500">{icon}</span>
 <span className="mono-label">{label}</span>
 </div>
 <div className="font-display text-3xl text-ink tracking-tight flex items-baseline gap-1.5">
 {value}
 {accent === "mint" && <Sparkles className="w-3.5 h-3.5 text-mint fill-mint" />}
 </div>
 </motion.div>
 );
}
