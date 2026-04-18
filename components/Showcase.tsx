"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CASES = [
 {
 room: "Bathroom",
 mood: "Spa Calm · Organic Minimal",
 before: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
 after: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
 range: "$480 – $1,450",
 verdict: "DIY",
 },
 {
 room: "Kitchen",
 mood: "Warm Modern · Entertaining Ready",
 before: "https://images.unsplash.com/photo-1556909172-8c2f041fca00?w=800&q=80",
 after: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
 range: "$4,200 – $9,800",
 verdict: "Pro",
 },
 {
 room: "Living room",
 mood: "Quiet Luxury · Light + Airy",
 before: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80",
 after: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
 range: "$680 – $2,100",
 verdict: "DIY",
 },
];

export default function Showcase() {
 return (
 <section className="section relative bg-canvas-200/60 border-y border-hairline">
 <div className="max-w-7xl mx-auto">
 <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
 <div className="max-w-xl">
 <span className="mono-label">recent transformations</span>
 <h2 className="font-display text-4xl md:text-5xl tracking-tight text-ink mt-2 leading-[1.05]">
 Real homes. Naili-read rooms.
 </h2>
 </div>
 <Link href="/my-projects" className="btn-ghost self-start md:self-end">
 Open Vision Board
 <ArrowRight className="w-4 h-4" />
 </Link>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {CASES.map((c, i) => (
 <motion.div
 key={c.room}
 initial={{ opacity: 0, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-5% 0px" }}
 transition={{ duration: 0.7, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
 className="group relative rounded-3xl overflow-hidden bg-canvas-50 border border-hairline hover:shadow-lift transition-all duration-500"
 >
 {/* Split image */}
 <div className="relative aspect-[4/3] overflow-hidden">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={c.before}
 alt={`${c.room} before`}
 className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
 />
 <div
 className="absolute inset-0 transition-all duration-700 group-hover:[clip-path:inset(0_0_0_0%)]"
 style={{ clipPath: "inset(0 0 0 50%)" }}
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={c.after}
 alt={`${c.room} after`}
 className="absolute inset-0 w-full h-full object-cover"
 />
 </div>

 {/* Labels */}
 <div className="absolute top-3 left-3">
 <span className="mono-label !text-canvas-50 bg-graphite-700/70 backdrop-blur px-2 py-0.5 rounded">current</span>
 </div>
 <div className="absolute top-3 right-3">
 <span className="mono-label !text-ink bg-sand/90 backdrop-blur px-2 py-0.5 rounded">vision</span>
 </div>

 {/* Verdict badge */}
 <div className="absolute bottom-3 right-3 bg-graphite-700/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
 <span className="mono-label !text-mint">{c.verdict.toLowerCase()} viable</span>
 </div>
 </div>

 {/* Meta */}
 <div className="p-5">
 <span className="mono-label">{c.mood}</span>
 <div className="flex items-end justify-between mt-1">
 <h3 className="font-display text-2xl text-ink tracking-tight">{c.room} refresh</h3>
 <span className="font-display text-lg text-ink-600 tabular-nums">{c.range}</span>
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 </section>
 );
}
