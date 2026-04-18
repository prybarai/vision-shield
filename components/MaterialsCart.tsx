"use client";

import { motion } from "framer-motion";
import { ExternalLink, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";

export interface Material {
 name: string;
 price: number;
 link: string;
 qty?: number;
}

const DEFAULT_MATERIALS: Material[] = [
 { name: "Paint Brush Set (3pc)", price: 14.99, link: "https://www.homedepot.com/s/paint+brush+set", qty: 1 },
 { name: "Eggshell Interior Paint · 1gal", price: 39.98, link: "https://www.homedepot.com/s/interior+paint+eggshell", qty: 2 },
 { name: "Painter's Tape · 1.88in", price: 7.28, link: "https://www.homedepot.com/s/painters+tape", qty: 2 },
 { name: "Drop Cloth · 9x12", price: 12.97, link: "https://www.homedepot.com/s/drop+cloth", qty: 1 },
 { name: "Caulk + Gun Combo", price: 18.48, link: "https://www.homedepot.com/s/caulk+gun", qty: 1 },
 { name: "Sanding Block Pack", price: 6.97, link: "https://www.homedepot.com/s/sanding+block", qty: 1 },
];

export default function MaterialsCart({ materials = DEFAULT_MATERIALS }: { materials?: Material[] }) {
 const [checked, setChecked] = useState<Set<string>>(new Set());

 const total = materials.reduce((sum, m) => sum + m.price * (m.qty ?? 1), 0);

 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.3 }}
 className="mt-5 glass-warm rounded-2xl p-5"
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2.5">
 <ShoppingCart className="w-4 h-4 text-ink-600" />
 <span className="mono-label">starter shopping list</span>
 </div>
 <span className="mono-label">{materials.length} items</span>
 </div>

 <div className="space-y-1.5">
 {materials.map((m) => {
 const isChecked = checked.has(m.name);
 return (
 <div
 key={m.name}
 className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-canvas-200/50 transition-colors"
 >
 <button
 onClick={() => {
 const next = new Set(checked);
 if (isChecked) next.delete(m.name); else next.add(m.name);
 setChecked(next);
 }}
 className="w-4 h-4 rounded border border-panel flex items-center justify-center shrink-0 transition-colors hover:border-ink/40"
 style={{ background: isChecked ? "var(--ink)" : "transparent" }}
 aria-label={`Mark ${m.name}`}
 >
 {isChecked && <Check className="w-3 h-3 text-canvas-50" strokeWidth={3} />}
 </button>
 <div className="flex-1 min-w-0">
 <p className={`text-sm font-medium truncate ${isChecked ? "line-through text-ink-500" : "text-ink"}`}>
 {m.name}
 </p>
 {(m.qty ?? 1) > 1 && (
 <span className="mono-label">qty {m.qty}</span>
 )}
 </div>
 <div className="text-sm tabular-nums text-ink-600">
 ${(m.price * (m.qty ?? 1)).toFixed(2)}
 </div>
 <a
 href={m.link}
 target="_blank"
 rel="noopener noreferrer"
 className="p-1.5 rounded-full text-ink-500 hover:text-ink hover:bg-canvas-200 transition-colors"
 aria-label={`Open ${m.name} at Home Depot`}
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 </div>
 );
 })}
 </div>

 <div className="hairline my-4" />

 <div className="flex items-center justify-between mb-3">
 <span className="mono-label">estimated total</span>
 <span className="font-display text-2xl text-ink tabular-nums">
 ${total.toFixed(2)}
 </span>
 </div>

 <a
 href="https://www.homedepot.com/cart"
 target="_blank"
 rel="noopener noreferrer"
 className="btn-primary w-full justify-center"
 >
 Check out at Home Depot
 <ExternalLink className="w-4 h-4" />
 </a>
 <p className="text-xs text-ink-500 mt-2.5 text-center">
 Naili earns a small referral when you shop — never at extra cost to you.
 </p>
 </motion.div>
 );
}
