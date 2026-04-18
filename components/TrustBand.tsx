"use client";

import { motion } from "framer-motion";

const LOGOS = [
 "House Beautiful", "Dwell", "Apartment Therapy", "Remodelista", "Wirecutter", "Better Homes",
];

export default function TrustBand() {
 return (
 <section className="relative z-10 py-12 px-6 md:px-10 border-y border-hairline bg-canvas-50">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center justify-center gap-2 mb-6">
 <div className="h-px w-8 bg-panel" />
 <span className="mono-label">as seen in</span>
 <div className="h-px w-8 bg-panel" />
 </div>
 <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
 {LOGOS.map((logo, i) => (
 <motion.span
 key={logo}
 initial={{ opacity: 0, y: 4 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5, delay: i * 0.08 }}
 className="font-display text-lg md:text-xl text-ink-600 italic tracking-tight"
 >
 {logo}
 </motion.span>
 ))}
 </div>
 </div>
 </section>
 );
}
