"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
 Camera, Trash2, ArrowRight, Sparkles, Copy, CheckCheck, PlusCircle,
} from "lucide-react";
import { useProjectStorage, type ProjectStatus, type SavedProject } from "@/lib/useProjectStorage";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { key: ProjectStatus | "all"; label: string }[] = [
 { key: "all", label: "All projects" },
 { key: "exploring", label: "Exploring" },
 { key: "planning", label: "Planning" },
 { key: "ready", label: "Ready" },
];

export default function VisionBoardGrid() {
 const { projects, removeProject, updateProject, clearAll } = useProjectStorage();
 const [filter, setFilter] = useState<ProjectStatus | "all">("all");

 const filtered = filter === "all"
 ? projects
 : projects.filter((p) => p.status === filter);

 return (
 <section className="section pt-4 relative">
 <div className="max-w-7xl mx-auto">
 {/* Filter bar */}
 <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
 <div className="flex flex-wrap gap-1.5 p-1 rounded-full bg-canvas-200 border border-hairline">
 {STATUS_FILTERS.map((f) => (
 <button
 key={f.key}
 onClick={() => setFilter(f.key)}
 className={cn(
 "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all",
 filter === f.key
 ? "bg-ink text-canvas-50 shadow-soft"
 : "text-ink-600 hover:text-ink"
 )}
 >
 {f.label}
 </button>
 ))}
 </div>

 <div className="flex items-center gap-3">
 <span className="mono-label">
 {projects.length} saved · {projects.filter((p) => p.verdict === "diy").length} DIY · {projects.filter((p) => p.verdict === "pro").length} pro
 </span>
 {projects.length > 0 && (
 <button
 onClick={() => {
 if (confirm("Clear your entire Vision Board? This can't be undone.")) clearAll();
 }}
 className="text-xs text-ink-500 hover:text-ink transition"
 >
 Clear all
 </button>
 )}
 </div>
 </div>

 {/* Empty state */}
 {filtered.length === 0 && (
 <EmptyState />
 )}

 {/* Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
 <AnimatePresence>
 {filtered.map((p) => (
 <ProjectCard
 key={p.id}
 project={p}
 onStatusChange={(status) => updateProject(p.id, { status })}
 onRemove={() => removeProject(p.id)}
 />
 ))}
 </AnimatePresence>

 {/* "New" tile */}
 {filtered.length > 0 && (
 <Link
 href="/#upload"
 className="group rounded-3xl border border-dashed border-panel bg-canvas-50/40 hover:bg-canvas-50 hover:border-ink/30 transition-all p-5 min-h-[22rem] flex flex-col items-center justify-center text-center"
 >
 <div className="w-12 h-12 rounded-xl bg-ink/5 group-hover:bg-ink group-hover:text-canvas-50 flex items-center justify-center mb-3 transition-all">
 <PlusCircle className="w-5 h-5" />
 </div>
 <p className="font-display text-xl text-ink">Add a new space</p>
 <p className="text-sm text-ink-500 mt-1">Upload another photo for Naili to read.</p>
 </Link>
 )}
 </div>
 </div>
 </section>
 );
}

function ProjectCard({
 project, onStatusChange, onRemove,
}: {
 project: SavedProject;
 onStatusChange: (s: ProjectStatus) => void;
 onRemove: () => void;
}) {
 const [hover, setHover] = useState(false);

 return (
 <motion.div
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.96 }}
 transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 className="group relative rounded-3xl overflow-hidden bg-canvas-50 border border-hairline hover:border-panel transition-all hover:shadow-lift hover:-translate-y-1 duration-500"
 >
 {/* Image preview */}
 <div className="relative aspect-[4/3] bg-graphite-700 overflow-hidden">
 {project.photoUrl && (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={project.photoUrl}
 alt={project.projectType}
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
 />
 )}
 {/* Concept reveals on hover */}
 {project.conceptUrl && (
 <div
 className="absolute inset-0 transition-all duration-700"
 style={{ clipPath: hover ? "inset(0 0 0 0%)" : "inset(0 0 0 100%)" }}
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={project.conceptUrl}
 alt={`${project.projectType} concept`}
 className="absolute inset-0 w-full h-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-br from-sand/15 via-transparent to-mint/10" />
 </div>
 )}

 {/* Status pill */}
 <div className="absolute top-3 left-3">
 <StatusPill status={project.status} />
 </div>

 {/* Verdict badge */}
 <div className="absolute top-3 right-3 bg-graphite-700/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
 <span className="mono-label !text-mint">
 {project.verdict === "diy" ? "diy viable" : "pro recommended"}
 </span>
 </div>

 {/* Hint on hover */}
 <div className={cn(
 "absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-graphite-700/80 backdrop-blur text-xs text-canvas-50 border border-white/10 transition-all duration-500",
 hover ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
 )}>
 <Camera className="w-3 h-3" />
 hover to see vision
 </div>
 </div>

 {/* Body */}
 <div className="p-5">
 <div className="flex items-center justify-between mb-1">
 <span className="mono-label">{new Date(project.createdAt).toLocaleDateString()}</span>
 <span className="mono-label">diff {project.difficultyScore}/10</span>
 </div>
 <h3 className="font-display text-2xl text-ink tracking-tight leading-tight">
 {project.projectType}
 </h3>

 {project.moods.length > 0 && (
 <div className="flex flex-wrap gap-1.5 mt-2">
 {project.moods.map((m) => (
 <span
 key={m}
 className="text-[11px] px-2 py-0.5 rounded-full bg-sand/20 border border-sand/40 text-ink"
 >
 {m}
 </span>
 ))}
 </div>
 )}

 <p className="text-sm text-ink-600 mt-3 line-clamp-2">
 {project.description}
 </p>

 <div className="flex items-end justify-between mt-4 pt-4 border-t border-hairline">
 <div>
 <span className="mono-label">est. range</span>
 <div className="font-display text-lg text-ink tabular-nums">
 ${project.costLow.toLocaleString()}–${project.costHigh.toLocaleString()}
 </div>
 </div>
 <div className="text-right">
 <span className="mono-label">timeline</span>
 <div className="font-display text-lg text-ink">{project.timelineWeeks}</div>
 </div>
 </div>

 {/* Actions */}
 <div className="mt-4 flex items-center gap-2">
 <Link
 href="/#upload"
 className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-ink text-canvas-50 text-sm font-medium hover:bg-graphite-600 transition"
 >
 Resume project
 <ArrowRight className="w-3.5 h-3.5" />
 </Link>
 <StatusSelect value={project.status} onChange={onStatusChange} />
 <button
 onClick={onRemove}
 className="p-2.5 rounded-full border border-hairline hover:border-panel hover:bg-canvas-200 text-ink-500 hover:text-ink transition"
 aria-label="Remove"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </motion.div>
 );
}

function StatusPill({ status }: { status: ProjectStatus }) {
 const styles: Record<ProjectStatus, string> = {
 exploring: "bg-canvas-50/85 text-ink border-hairline",
 planning: "bg-sand text-graphite-700 border-sand-dark",
 ready: "bg-mint text-graphite-700 border-mint",
 };
 return (
 <span className={cn(
 "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border backdrop-blur text-[11px] font-medium",
 styles[status]
 )}>
 <span className="w-1.5 h-1.5 rounded-full bg-current" />
 {status}
 </span>
 );
}

function StatusSelect({
 value, onChange,
}: {
 value: ProjectStatus;
 onChange: (s: ProjectStatus) => void;
}) {
 const [open, setOpen] = useState(false);
 const options: ProjectStatus[] = ["exploring", "planning", "ready"];
 return (
 <div className="relative">
 <button
 onClick={() => setOpen(!open)}
 className="p-2.5 rounded-full border border-hairline hover:border-panel hover:bg-canvas-200 text-ink-500 hover:text-ink transition"
 aria-label="Change status"
 >
 <Copy className="w-3.5 h-3.5" />
 </button>
 {open && (
 <>
 <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
 <motion.div
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 className="absolute right-0 top-full mt-1.5 z-30 glass-warm rounded-xl p-1.5 min-w-[150px]"
 >
 {options.map((o) => (
 <button
 key={o}
 onClick={() => { onChange(o); setOpen(false); }}
 className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-ink hover:bg-canvas-200 transition"
 >
 <span className="capitalize">{o}</span>
 {value === o && <CheckCheck className="w-3 h-3 text-sand-dark" />}
 </button>
 ))}
 </motion.div>
 </>
 )}
 </div>
 );
}

function EmptyState() {
 return (
 <div className="relative glass-warm rounded-3xl p-12 text-center overflow-hidden">
 <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sand/20 blur-3xl pointer-events-none" />
 <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-mint/10 blur-3xl pointer-events-none" />

 <div className="relative">
 <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink text-canvas-50 mb-5">
 <Sparkles className="w-6 h-6" />
 </div>
 <h2 className="font-display text-3xl text-ink tracking-tight">Your Vision Board is empty.</h2>
 <p className="text-ink-600 mt-2 max-w-md mx-auto">
 Upload a photo of any space and save the plan — it'll live here as an
 evolving roadmap for your home.
 </p>
 <Link href="/#upload" className="btn-primary inline-flex mt-6">
 Start your first project
 <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 );
}
