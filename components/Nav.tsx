"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Nav() {
 const pathname = usePathname();
 const isPro = pathname?.startsWith("/pro");

 return (
 <motion.header
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
 className={cn(
 "fixed top-0 inset-x-0 z-50 px-6 md:px-10 py-5 flex items-center justify-between",
 isPro
 ? "backdrop-blur-md bg-graphite-700/70 border-b border-white/5"
 : "backdrop-blur-md bg-canvas-50/70 border-b border-hairline"
 )}
 >
 <Link href="/" className="flex items-center gap-2.5 group">
 <Logo dark={isPro} />
 <span
 className={cn(
 "font-display text-xl tracking-tight",
 isPro ? "text-canvas-50" : "text-ink"
 )}
 >
 naili
 </span>
 <span
 className={cn(
 "mono-label transition-opacity",
 isPro ? "!text-mint" : "!text-ink-500"
 )}
 >
 {isPro ? "/ pro" : "/ home"}
 </span>
 </Link>

 <nav className="hidden md:flex items-center gap-1">
 {isPro ? (
 <>
 <NavLink href="/pro" dark>Dashboard</NavLink>
 <NavLink href="/pro#brief" dark>Lead Brief</NavLink>
 <NavLink href="/pro#access" dark>Request Access</NavLink>
 <Link
 href="/"
 className="ml-3 px-4 py-2 text-sm text-canvas-50/80 hover:text-canvas-50 transition"
 >
 Homeowner →
 </Link>
 </>
 ) : (
 <>
 <NavLink href="/#how">How it works</NavLink>
 <NavLink href="/my-projects">Vision Board</NavLink>
 <NavLink href="/pro">For Pros</NavLink>
 <Link
 href="/#upload"
 className="btn-primary ml-3 !py-2.5 !px-5 text-sm"
 >
 Upload Your Space
 </Link>
 </>
 )}
 </nav>

 <div className="flex md:hidden items-center gap-2">
 <div className="ai-pulse" />
 <span className={cn("mono-label", isPro ? "!text-canvas-50/60" : "")}>
 naili active
 </span>
 </div>
 </motion.header>
 );
}

function NavLink({
 href,
 children,
 dark,
}: {
 href: string;
 children: React.ReactNode;
 dark?: boolean;
}) {
 return (
 <Link
 href={href}
 className={cn(
 "px-3.5 py-2 text-sm rounded-full transition-all duration-300",
 dark
 ? "text-canvas-50/70 hover:text-canvas-50 hover:bg-white/5"
 : "text-ink-600 hover:text-ink hover:bg-ink/[0.04]"
 )}
 >
 {children}
 </Link>
 );
}

function Logo({ dark }: { dark?: boolean }) {
 return (
 <svg
 width="28"
 height="28"
 viewBox="0 0 32 32"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 className="transition-transform group-hover:rotate-12 duration-500"
 >
 <circle
 cx="16"
 cy="16"
 r="15"
 stroke={dark ? "#B8D8C8" : "#17181C"}
 strokeWidth="1.5"
 opacity="0.9"
 />
 <path
 d="M10 22 L10 10 L22 22 L22 10"
 stroke={dark ? "#B8D8C8" : "#17181C"}
 strokeWidth="1.8"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <circle cx="16" cy="16" r="1.4" fill={dark ? "#D8B98A" : "#D8B98A"} />
 </svg>
 );
}
