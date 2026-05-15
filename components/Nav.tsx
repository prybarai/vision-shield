"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Nav() {
 const pathname = usePathname();
 const isPro = pathname?.startsWith("/pro");
 const [mobileOpen, setMobileOpen] = useState(false);

 return (
  <>
   <motion.header
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
    className={cn(
     "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10",
     isPro
      ? "border-b border-white/5 bg-graphite-700/70 backdrop-blur-md"
      : "border-b border-hairline bg-canvas-50/70 backdrop-blur-md"
    )}
   >
    <Link href="/" className="group flex items-center gap-2.5">
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

    {/* Desktop nav */}
    <nav className="hidden items-center gap-1 md:flex">
     {isPro ? (
      <>
       <NavLink href="/pro" dark>
        Overview
       </NavLink>
       <NavLink href="/pro#access" dark>
        Request Access
       </NavLink>
       <Link
        href="/"
        className="ml-3 px-4 py-2 text-sm text-canvas-50/80 transition hover:text-canvas-50"
       >
        Homeowner site →
       </Link>
      </>
     ) : (
      <>
       <NavLink href="/#how">How it works</NavLink>
       <NavLink href="/my-projects">Vision Board</NavLink>
       <NavLink href="/pro">For Pros</NavLink>
       <Link
        href="/#upload"
        className="btn-primary ml-3 !px-5 !py-2.5 text-sm"
       >
        Upload Your Space
       </Link>
      </>
     )}
    </nav>

    {/* Mobile hamburger */}
    <button
     onClick={() => setMobileOpen(!mobileOpen)}
     className={cn(
      "flex items-center justify-center rounded-xl p-2 transition md:hidden",
      isPro
       ? "text-canvas-50 hover:bg-white/10"
       : "text-ink hover:bg-ink/5"
     )}
     aria-label="Toggle menu"
    >
     {mobileOpen ? (
      <X className="h-6 w-6" />
     ) : (
      <Menu className="h-6 w-6" />
     )}
    </button>
   </motion.header>

   {/* Mobile menu overlay */}
   <AnimatePresence>
    {mobileOpen && (
     <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className={cn(
       "fixed inset-x-0 top-[73px] z-40 border-b px-6 pb-6 pt-4 md:hidden",
       isPro
        ? "border-white/5 bg-graphite-700/95 backdrop-blur-xl"
        : "border-hairline bg-canvas-50/95 backdrop-blur-xl"
      )}
     >
      <nav className="flex flex-col gap-1">
       {isPro ? (
        <>
         <MobileNavLink
          href="/pro"
          dark
          onClick={() => setMobileOpen(false)}
         >
          Overview
         </MobileNavLink>
         <MobileNavLink
          href="/pro#access"
          dark
          onClick={() => setMobileOpen(false)}
         >
          Request Access
         </MobileNavLink>
         <div className="my-2 h-px bg-white/10" />
         <MobileNavLink
          href="/"
          dark
          onClick={() => setMobileOpen(false)}
         >
          Homeowner site →
         </MobileNavLink>
        </>
       ) : (
        <>
         <MobileNavLink
          href="/#how"
          onClick={() => setMobileOpen(false)}
         >
          How it works
         </MobileNavLink>
         <MobileNavLink
          href="/my-projects"
          onClick={() => setMobileOpen(false)}
         >
          Vision Board
         </MobileNavLink>
         <MobileNavLink
          href="/pro"
          onClick={() => setMobileOpen(false)}
         >
          For Pros
         </MobileNavLink>
         <div className="my-2 h-px bg-hairline" />
         <Link
          href="/#upload"
          onClick={() => setMobileOpen(false)}
          className="btn-primary mt-1 w-full justify-center text-center"
         >
          Upload Your Space
         </Link>
        </>
       )}
      </nav>
     </motion.div>
    )}
   </AnimatePresence>
  </>
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
    "rounded-full px-3.5 py-2 text-sm transition-all duration-300",
    dark
     ? "text-canvas-50/70 hover:bg-white/5 hover:text-canvas-50"
     : "text-ink-600 hover:bg-ink/[0.04] hover:text-ink"
   )}
  >
   {children}
  </Link>
 );
}

function MobileNavLink({
 href,
 children,
 dark,
 onClick,
}: {
 href: string;
 children: React.ReactNode;
 dark?: boolean;
 onClick?: () => void;
}) {
 return (
  <Link
   href={href}
   onClick={onClick}
   className={cn(
    "rounded-xl px-4 py-3 text-base font-medium transition",
    dark
     ? "text-canvas-50/80 hover:bg-white/5 hover:text-canvas-50"
     : "text-ink-600 hover:bg-ink/[0.04] hover:text-ink"
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
   className="transition-transform duration-500 group-hover:rotate-12"
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
   <circle cx="16" cy="16" r="1.4" fill="#D8B98A" />
  </svg>
 );
}
