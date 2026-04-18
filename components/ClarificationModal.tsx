"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, MessageCircle } from "lucide-react";

export interface ClarificationQuestion {
 id: string;
 prompt: string;
 options: string[];
}

const DEFAULT_QUESTIONS: ClarificationQuestion[] = [
 {
 id: "wall_fate",
 prompt: "Is that wall coming down, or just getting a new look?",
 options: ["Just paint / finish", "Minor patch + paint", "Taking it down"],
 },
 {
 id: "floor_keep",
 prompt: "Are we keeping the existing floor underneath?",
 options: ["Yes, keep it", "Replace it", "Not sure yet"],
 },
 {
 id: "diy_demo",
 prompt: "Open to doing the demo yourself?",
 options: ["I'll handle demo", "Pros do everything", "Depends on scope"],
 },
];

interface Props {
 open: boolean;
 onClose: () => void;
 onComplete: (answers: Record<string, string>) => void;
 questions?: ClarificationQuestion[];
}

export default function ClarificationModal({
 open, onClose, onComplete, questions = DEFAULT_QUESTIONS,
}: Props) {
 const [step, setStep] = useState(0);
 const [answers, setAnswers] = useState<Record<string, string>>({});

 const q = questions[step];
 const isLast = step === questions.length - 1;

 const pick = (opt: string) => {
 const next = { ...answers, [q.id]: opt };
 setAnswers(next);
 if (isLast) {
 setTimeout(() => onComplete(next), 400);
 } else {
 setTimeout(() => setStep(step + 1), 300);
 }
 };

 return (
 <AnimatePresence>
 {open && (
 <>
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] bg-graphite-800/40 backdrop-blur-sm"
 onClick={onClose}
 />
 {/* Modal */}
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.96 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 10, scale: 0.98 }}
 transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
 className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
 >
 <div className="glass-warm rounded-3xl p-6 md:p-8 max-w-lg w-full pointer-events-auto relative overflow-hidden">
 <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sand/20 blur-3xl pointer-events-none" />

 <div className="flex items-center gap-2.5 mb-5 relative">
 <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center">
 <MessageCircle className="w-4 h-4 text-canvas-50" />
 </div>
 <div>
 <span className="mono-label">naili · quick check</span>
 <p className="text-sm text-ink-600">
 I want this estimate to be really accurate.
 </p>
 </div>
 <span className="ml-auto mono-label">
 {step + 1}/{questions.length}
 </span>
 </div>

 {/* Progress */}
 <div className="h-0.5 bg-ink/5 rounded-full mb-6 overflow-hidden">
 <motion.div
 className="h-full bg-gradient-to-r from-sand to-sand-dark"
 initial={false}
 animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
 transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
 />
 </div>

 <AnimatePresence mode="wait">
 <motion.div
 key={q.id}
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 transition={{ duration: 0.35 }}
 >
 <h3 className="font-display text-2xl text-ink tracking-tight mb-5">
 {q.prompt}
 </h3>

 <div className="flex flex-col gap-2.5">
 {q.options.map((opt) => {
 const selected = answers[q.id] === opt;
 return (
 <button
 key={opt}
 onClick={() => pick(opt)}
 className={cn(
 "group flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all duration-300 border",
 selected
 ? "bg-ink text-canvas-50 border-ink"
 : "bg-canvas-50/60 text-ink border-hairline hover:border-panel hover:bg-canvas-50"
 )}
 >
 <span className="font-medium">{opt}</span>
 <ArrowRight className={cn(
 "w-4 h-4 transition-transform duration-300",
 selected ? "translate-x-1" : "group-hover:translate-x-1"
 )} />
 </button>
 );
 })}
 </div>
 </motion.div>
 </AnimatePresence>

 <div className="mt-5 flex items-center justify-between text-xs text-ink-500">
 <span>Your answers add a verified scope flag to the brief.</span>
 <button onClick={onClose} className="hover:text-ink transition">
 Skip
 </button>
 </div>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
