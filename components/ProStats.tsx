"use client";

import { motion } from "framer-motion";

const STATS = [
 { value: "3.4x", label: "close rate on naili briefs vs. generic leads" },
 { value: "< $0", label: "paid per lead — pros subscribe, not pay-per-lead" },
 { value: "92%", label: "of pros say briefs saved them a site visit" },
 { value: "14m", label: "avg. response from brief to first homeowner reply" },
];

export default function ProStats() {
 return (
 <section className="relative z-10 py-10 px-6 md:px-10 border-y border-white/5 bg-graphite-800/40 backdrop-blur-sm">
 <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
 {STATS.map((s, i) => (
 <motion.div
 key={s.label}
 initial={{ opacity: 0, y: 6 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6, delay: i * 0.08 }}
 >
 <div className="font-display text-3xl md:text-4xl text-canvas-50 tracking-tight tabular-nums">
 {s.value}
 </div>
 <p className="mono-label !text-canvas-50/50 mt-1">{s.label}</p>
 </motion.div>
 ))}
 </div>
 </section>
 );
}
