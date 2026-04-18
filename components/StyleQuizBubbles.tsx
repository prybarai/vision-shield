"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface Mood {
 key: string;
 label: string;
 hint: string;
}

export const MOODS: Mood[] = [
 { key: "quiet-luxury", label: "Quiet Luxury", hint: "restrained, tactile" },
 { key: "warm-modern", label: "Warm Modern", hint: "clean + inviting" },
 { key: "organic-min", label: "Organic Minimal", hint: "natural, spare" },
 { key: "family-cozy", label: "Family Cozy", hint: "lived-in warmth" },
 { key: "spa-calm", label: "Spa Calm", hint: "quiet wellness" },
 { key: "design-forward", label: "Design Forward", hint: "bold, editorial" },
 { key: "entertain", label: "Entertaining Ready", hint: "open, social" },
 { key: "light-airy", label: "Light + Airy", hint: "soft, luminous" },
];

interface Props {
 selected: string[];
 onChange: (next: string[]) => void;
 max?: number;
}

export default function StyleQuizBubbles({ selected, onChange, max = 3 }: Props) {
 const toggle = (key: string) => {
 if (selected.includes(key)) {
 onChange(selected.filter((k) => k !== key));
 } else if (selected.length < max) {
 onChange([...selected, key]);
 }
 };

 return (
 <div className="w-full">
 <div className="flex items-end justify-between mb-5">
 <div>
 <span className="mono-label">step 02 · mood board</span>
 <h3 className="font-display text-2xl md:text-3xl text-ink mt-1 tracking-tight">
 Pick 3 vibes for this space.
 </h3>
 <p className="text-ink-600 text-sm mt-1">
 Naili will carry these into your concept and your shopping list.
 </p>
 </div>
 <span className="mono-label shrink-0">{selected.length}/{max}</span>
 </div>

 <div className="flex flex-wrap gap-2.5">
 {MOODS.map((m, i) => {
 const isSelected = selected.includes(m.key);
 const isMaxed = selected.length >= max && !isSelected;
 return (
 <motion.button
 key={m.key}
 type="button"
 onClick={() => toggle(m.key)}
 disabled={isMaxed}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
 whileHover={!isMaxed ? { y: -2 } : {}}
 whileTap={!isMaxed ? { scale: 0.97 } : {}}
 className={cn(
 "group relative px-4 py-2.5 rounded-full border text-sm transition-all duration-300",
 "flex items-center gap-2",
 isSelected
 ? "bg-ink text-canvas-50 border-ink shadow-lift"
 : "bg-canvas-50 text-ink border-hairline hover:border-panel",
 isMaxed && "opacity-40 cursor-not-allowed"
 )}
 >
 <AnimatePresence mode="wait">
 {isSelected && (
 <motion.span
 key="check"
 initial={{ opacity: 0, scale: 0.6 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.6 }}
 transition={{ duration: 0.2 }}
 >
 <Check className="w-3.5 h-3.5 text-mint" strokeWidth={2.5} />
 </motion.span>
 )}
 </AnimatePresence>
 <span className="font-medium">{m.label}</span>
 <span className={cn(
 "text-xs",
 isSelected ? "text-canvas-50/60" : "text-ink-500"
 )}>
 {m.hint}
 </span>

 {/* Selected glow */}
 {isSelected && (
 <div className="absolute -inset-1 rounded-full bg-sand/20 blur-lg -z-10" />
 )}
 </motion.button>
 );
 })}
 </div>

 {selected.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 className="mt-5 flex items-center gap-2"
 >
 <span className="mono-label">designed for:</span>
 <span className="text-sm text-ink font-medium">
 {selected.map((k) => MOODS.find((m) => m.key === k)?.label).join(" + ")}
 </span>
 </motion.div>
 )}
 </div>
 );
}
