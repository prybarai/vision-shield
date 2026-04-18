"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";
import VisionReveal from "./VisionReveal";
import StyleQuizBubbles, { MOODS } from "./StyleQuizBubbles";
import ClarificationModal from "./ClarificationModal";
import ProjectFateCard from "./ProjectFateCard";
import { useProjectStorage } from "@/lib/useProjectStorage";

// Placeholder concept images (demo only).
const CONCEPT_IMAGES: Record<string, string> = {
 default: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
 bathroom: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80",
 kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
 bedroom: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80",
 livingroom: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
};

type Stage = "upload" | "describe" | "clarify" | "reveal" | "mood" | "results";

export default function UploadStage() {
 const [stage, setStage] = useState<Stage>("upload");
 const [photoUrl, setPhotoUrl] = useState<string | null>(null);
 const [description, setDescription] = useState("");
 const [moods, setMoods] = useState<string[]>([]);
 const [scopeFlags, setScopeFlags] = useState<Record<string, string>>({});
 const [projectType, setProjectType] = useState("Bathroom Refresh");
 const [saved, setSaved] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const { saveProject } = useProjectStorage();

 // Demo heuristic — difficulty depends on keywords.
 const difficulty = (() => {
 const text = description.toLowerCase();
 if (/\b(plumbing|electrical|tile|demo|wall down|move)\b/.test(text)) return 8;
 if (/\b(floor|vanity|lighting|fixture)\b/.test(text)) return 6;
 return 4;
 })();

 const conceptUrl = (() => {
 const t = description.toLowerCase();
 if (t.includes("kitchen")) return CONCEPT_IMAGES.kitchen;
 if (t.includes("bed")) return CONCEPT_IMAGES.bedroom;
 if (t.includes("living")) return CONCEPT_IMAGES.livingroom;
 return CONCEPT_IMAGES.bathroom;
 })();

 // Pick project type from description for the saved card.
 const inferType = (t: string) => {
 const s = t.toLowerCase();
 if (s.includes("kitchen")) return "Kitchen Refresh";
 if (s.includes("bed")) return "Bedroom Refresh";
 if (s.includes("living")) return "Living Room Refresh";
 if (s.includes("bath")) return "Bathroom Refresh";
 return "Home Refresh";
 };

 const onFile = useCallback((f: File) => {
 const url = URL.createObjectURL(f);
 setPhotoUrl(url);
 setStage("describe");
 }, []);

 const handleSubmitDescription = () => {
 if (!description.trim()) return;
 setProjectType(inferType(description));
 setStage("clarify");
 };

 const handleClarifyComplete = (answers: Record<string, string>) => {
 setScopeFlags(answers);
 setStage("reveal");
 };

 const handleRevealComplete = () => {
 setStage("mood");
 };

 const handleMoodsConfirm = () => {
 if (moods.length === 0) return;
 setStage("results");
 };

 const handleSaveToVisionBoard = () => {
 if (!photoUrl) return;
 saveProject({
 photoUrl,
 conceptUrl,
 description,
 moods: moods.map((k) => MOODS.find((m) => m.key === k)?.label ?? k),
 projectType,
 verdict: difficulty > 6 ? "pro" : "diy",
 difficultyScore: difficulty,
 costLow: difficulty > 6 ? 3200 : 480,
 costHigh: difficulty > 6 ? 8400 : 1450,
 timelineWeeks: difficulty > 6 ? "2–4 weeks" : "1 weekend",
 verifiedScopeFlags: scopeFlags,
 });
 setSaved(true);
 };

 const reset = () => {
 setStage("upload");
 setPhotoUrl(null);
 setDescription("");
 setMoods([]);
 setScopeFlags({});
 setSaved(false);
 };

 return (
 <section id="upload" className="section relative">
 <div className="max-w-5xl mx-auto relative">
 {/* Ambient radial glow */}
 <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80%] h-80 bg-radial-warm pointer-events-none -z-10" />

 {/* Stage: upload */}
 <AnimatePresence mode="wait">
 {stage === "upload" && (
 <motion.div
 key="upload"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 className="text-center"
 >
 <span className="mono-label">step 01 · upload your space</span>
 <h2 className="font-display text-4xl md:text-6xl tracking-tight text-ink mt-3 mb-4">
 Let Naili read the room.
 </h2>
 <p className="text-ink-600 text-lg max-w-xl mx-auto mb-8">
 Drop in a photo. We'll identify surfaces, suggest a concept, and map your realistic next move.
 </p>

 <DropZone onFile={onFile} fileInputRef={fileInputRef} />

 <p className="mono-label mt-6">no account needed · photo stays on your device until you hit save</p>
 </motion.div>
 )}

 {stage === "describe" && photoUrl && (
 <motion.div
 key="describe"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 className="grid md:grid-cols-2 gap-8 items-center"
 >
 <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lift">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={photoUrl} alt="Your space" className="w-full h-full object-cover" />
 <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-graphite-700/70 backdrop-blur rounded-full">
 <div className="ai-pulse" />
 <span className="mono-label !text-canvas-50">photo received</span>
 </div>
 </div>

 <div>
 <span className="mono-label">step 01 · describe</span>
 <h2 className="font-display text-3xl md:text-4xl text-ink mt-1 mb-4 tracking-tight">
 What are you hoping to change?
 </h2>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="e.g. refresh this bathroom — new vanity, swap tile for LVP, keep the window…"
 rows={5}
 className="w-full p-4 rounded-2xl bg-canvas-50 border border-hairline focus:border-panel focus:outline-none focus:ring-4 focus:ring-sand/20 text-ink placeholder:text-ink-500 resize-none transition-all"
 />
 <div className="flex items-center gap-3 mt-4">
 <button
 onClick={handleSubmitDescription}
 disabled={!description.trim()}
 className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <Sparkles className="w-4 h-4" />
 Let Naili read it
 </button>
 <button onClick={reset} className="text-sm text-ink-500 hover:text-ink transition">
 Start over
 </button>
 </div>
 </div>
 </motion.div>
 )}

 {stage === "reveal" && photoUrl && (
 <motion.div
 key="reveal"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 >
 <VisionReveal
 photoUrl={photoUrl}
 conceptUrl={conceptUrl}
 description={description}
 onComplete={handleRevealComplete}
 />
 </motion.div>
 )}

 {stage === "mood" && (
 <motion.div
 key="mood"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 className="max-w-3xl mx-auto"
 >
 <StyleQuizBubbles selected={moods} onChange={setMoods} />
 <div className="mt-8 flex items-center gap-3">
 <button
 onClick={handleMoodsConfirm}
 disabled={moods.length === 0}
 className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
 >
 Build my project plan
 <Sparkles className="w-4 h-4" />
 </button>
 <span className="mono-label">
 {moods.length === 0
 ? "pick at least one vibe"
 : `${moods.length} selected`}
 </span>
 </div>
 </motion.div>
 )}

 {stage === "results" && (
 <motion.div
 key="results"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
 className="space-y-12"
 >
 {/* Scope flags recap */}
 {Object.keys(scopeFlags).length > 0 && (
 <div className="max-w-5xl mx-auto">
 <span className="mono-label">verified scope · from your answers</span>
 <div className="flex flex-wrap gap-2 mt-2">
 {Object.entries(scopeFlags).map(([k, v]) => (
 <span
 key={k}
 className="px-3 py-1 rounded-full bg-mint/30 border border-mint/50 text-xs text-ink font-medium"
 >
 {v}
 </span>
 ))}
 </div>
 </div>
 )}

 <ProjectFateCard
 difficultyScore={difficulty}
 costLow={difficulty > 6 ? 3200 : 480}
 costHigh={difficulty > 6 ? 8400 : 1450}
 timeline={difficulty > 6 ? "2–4 weeks" : "One weekend"}
 onSave={handleSaveToVisionBoard}
 saved={saved}
 />

 <div className="text-center">
 <button onClick={reset} className="btn-ghost">
 Start another project
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Clarification Modal */}
 <ClarificationModal
 open={stage === "clarify"}
 onClose={() => setStage("reveal")}
 onComplete={handleClarifyComplete}
 />
 </div>
 </section>
 );
}

function DropZone({
 onFile, fileInputRef,
}: {
 onFile: (f: File) => void;
 fileInputRef: React.RefObject<HTMLInputElement>;
}) {
 const [dragOver, setDragOver] = useState(false);

 return (
 <motion.div
 whileHover={{ y: -2 }}
 transition={{ duration: 0.3 }}
 onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
 onDragLeave={() => setDragOver(false)}
 onDrop={(e) => {
 e.preventDefault();
 setDragOver(false);
 const f = e.dataTransfer.files?.[0];
 if (f) onFile(f);
 }}
 className={`relative mx-auto max-w-xl rounded-3xl border border-dashed p-12 transition-all duration-300 cursor-pointer group ${
 dragOver
 ? "border-sand bg-sand/10 shadow-glow"
 : "border-panel bg-canvas-50/60 hover:border-ink/30 hover:bg-canvas-50"
 }`}
 onClick={() => fileInputRef.current?.click()}
 >
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*"
 className="hidden"
 onChange={(e) => {
 const f = e.target.files?.[0];
 if (f) onFile(f);
 }}
 />
 <div className="flex flex-col items-center">
 <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
 <Upload className="w-6 h-6 text-canvas-50" />
 </div>
 <p className="font-display text-xl text-ink mb-1">Drop a photo or click to upload</p>
 <p className="text-sm text-ink-500">JPG, PNG, HEIC — up to 20MB</p>
 </div>

 {/* Decorative corner marks — future lab energy */}
 <Corner className="top-3 left-3" />
 <Corner className="top-3 right-3" rotate={90} />
 <Corner className="bottom-3 right-3" rotate={180} />
 <Corner className="bottom-3 left-3" rotate={270} />
 </motion.div>
 );
}

function Corner({ className, rotate = 0 }: { className?: string; rotate?: number }) {
 return (
 <svg
 className={`absolute w-4 h-4 text-ink/20 ${className}`}
 style={{ transform: `rotate(${rotate}deg)` }}
 viewBox="0 0 16 16" fill="none"
 >
 <path d="M1 7V1H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
 </svg>
 );
}
