"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Footer() {
 const pathname = usePathname();
 const isPro = pathname?.startsWith("/pro");

 return (
 <footer
 className={cn(
 "relative z-10 border-t px-6 md:px-10 py-10 mt-24",
 isPro
 ? "border-white/5 bg-graphite-800 text-canvas-50/60"
 : "border-hairline bg-canvas-200/40 text-ink-600"
 )}
 >
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
 <div className="flex items-center gap-3">
 <span className="font-display text-lg tracking-tight">naili</span>
 <span className="mono-label">© 2026 naili labs</span>
 </div>
 <div className="flex items-center gap-5 text-sm">
 <Link href="/" className="hover:opacity-100 opacity-70 transition">Home</Link>
 <Link href="/my-projects" className="hover:opacity-100 opacity-70 transition">Vision Board</Link>
 <Link href="/pro" className="hover:opacity-100 opacity-70 transition">For Pros</Link>
 <a href="#" className="hover:opacity-100 opacity-70 transition">Privacy</a>
 </div>
 <div className="flex items-center gap-2">
 <div className="ai-pulse" />
 <span className="mono-label">naili engine v2.0</span>
 </div>
 </div>
 </footer>
 );
}
