"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function ProAccessForm() {
 const [email, setEmail] = useState("");
 const [city, setCity] = useState("");
 const [trade, setTrade] = useState("general");
 const [submitted, setSubmitted] = useState(false);

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!email || !city) return;
 setSubmitted(true);
 };

 return (
 <section id="access" className="section relative">
 <div className="max-w-3xl mx-auto">
 <motion.div
 initial={{ opacity: 0, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.7 }}
 className="relative glass-dark rounded-3xl p-8 md:p-12 overflow-hidden"
 >
 <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-sand/15 blur-3xl pointer-events-none" />
 <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-mint/10 blur-3xl pointer-events-none" />

 {!submitted ? (
 <>
 <span className="mono-label !text-mint">pro access · limited per city</span>
 <h2 className="font-display text-3xl md:text-4xl tracking-tight text-canvas-50 mt-2 leading-tight">
 Request early access to briefs
 <br /> in your city.
 </h2>
 <p className="text-canvas-50/60 text-sm mt-3 max-w-lg">
 We cap pro access per city to keep quality high. Most trades get
 a decision within 48 hours.
 </p>

 <form onSubmit={handleSubmit} className="mt-7 space-y-3">
 <div className="grid md:grid-cols-2 gap-3">
 <Input
 placeholder="you@yourco.com"
 type="email"
 value={email}
 onChange={setEmail}
 label="work email"
 />
 <Input
 placeholder="San Jose, CA"
 value={city}
 onChange={setCity}
 label="city"
 />
 </div>

 <div>
 <label className="block mono-label !text-canvas-50/50 mb-1.5">primary trade</label>
 <div className="flex flex-wrap gap-2">
 {[
 ["general", "General Contractor"],
 ["tile", "Tile + Flooring"],
 ["bath", "Bath Renovation"],
 ["kitchen", "Kitchen Remodel"],
 ["paint", "Paint + Finish"],
 ["design-build", "Design-Build"],
 ].map(([k, v]) => (
 <button
 key={k}
 type="button"
 onClick={() => setTrade(k)}
 className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
 trade === k
 ? "bg-sand text-graphite-700 border-sand"
 : "bg-white/5 text-canvas-50/80 border-white/10 hover:border-white/25"
 }`}
 >
 {v}
 </button>
 ))}
 </div>
 </div>

 <button
 type="submit"
 className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-sand text-graphite-700 font-medium text-sm hover:bg-sand-light transition-all hover:shadow-glow"
 >
 Request access
 <ArrowRight className="w-4 h-4" />
 </button>

 <p className="text-xs text-canvas-50/40 text-center">
 Leads are delivered securely to your email or CRM via{" "}
 <span className="text-canvas-50/70">Prybar Connect</span> — our
 secure lead infrastructure. No spam, just the brief.
 </p>
 </form>
 </>
 ) : (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.5 }}
 className="text-center py-6"
 >
 <div className="w-14 h-14 rounded-full bg-mint/20 border border-mint/40 flex items-center justify-center mx-auto mb-5">
 <CheckCircle2 className="w-6 h-6 text-mint" />
 </div>
 <h3 className="font-display text-3xl text-canvas-50 tracking-tight">
 You're on the list.
 </h3>
 <p className="text-canvas-50/60 mt-2">
 We'll reach out within 48 hours with next steps.
 </p>
 <p className="mono-label !text-canvas-50/40 mt-4">
 {email} · {city}
 </p>
 </motion.div>
 )}
 </motion.div>
 </div>
 </section>
 );
}

function Input({
 label, value, onChange, placeholder, type = "text",
}: {
 label: string;
 value: string;
 onChange: (v: string) => void;
 placeholder: string;
 type?: string;
}) {
 return (
 <div>
 <label className="block mono-label !text-canvas-50/50 mb-1.5">{label}</label>
 <input
 type={type}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-canvas-50 placeholder:text-canvas-50/30 focus:outline-none focus:ring-2 focus:ring-sand/40 focus:border-sand/40 transition"
 />
 </div>
 );
}
