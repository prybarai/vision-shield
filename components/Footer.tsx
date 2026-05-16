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
        "relative z-10 border-t px-6 py-10 md:px-10",
        isPro
          ? "border-white/5 bg-graphite-800 text-white/50"
          : "border-hairline bg-graphite text-white/50"
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="font-display text-lg tracking-tight text-white">naili</span>
          <span className="text-xs text-white/30">&copy; {new Date().getFullYear()} Naili Labs</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/my-projects" className="transition hover:text-white">
            My Projects
          </Link>
          <Link href="/get-quotes" className="transition hover:text-white">
            Get Quotes
          </Link>
          <Link href="/pro" className="transition hover:text-white">
            For Pros
          </Link>
          <Link href="/privacy" className="transition hover:text-white">
            Privacy
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="ai-pulse" />
          <span className="text-xs text-white/40">AI-powered</span>
        </div>
      </div>
    </footer>
  );
}
