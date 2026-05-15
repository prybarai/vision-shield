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
    "relative z-10 mt-24 border-t px-6 py-10 md:px-10",
    isPro
     ? "border-white/5 bg-graphite-800 text-canvas-50/60"
     : "border-hairline bg-canvas-200/40 text-ink-600"
   )}
  >
   <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
    <div className="flex items-center gap-3">
     <span className="font-display text-lg tracking-tight">naili</span>
     <span className="mono-label">&copy; {new Date().getFullYear()} naili labs</span>
    </div>
    <div className="flex items-center gap-5 text-sm">
     <Link
      href="/"
      className="opacity-70 transition hover:opacity-100"
     >
      Home
     </Link>
     <Link
      href="/my-projects"
      className="opacity-70 transition hover:opacity-100"
     >
      Vision Board
     </Link>
     <Link
      href="/pro"
      className="opacity-70 transition hover:opacity-100"
     >
      For Pros
     </Link>
     <Link
      href="/privacy"
      className="opacity-70 transition hover:opacity-100"
     >
      Privacy
     </Link>
    </div>
    <div className="flex items-center gap-2">
     <div className="ai-pulse" />
     <span className="mono-label">AI-powered</span>
    </div>
   </div>
  </footer>
 );
}
