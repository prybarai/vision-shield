import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VisionBoardGrid from "@/components/VisionBoardGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Vision Board — Naili",
 description: "Your evolving home roadmap. Saved projects, concepts, and next moves.",
};

export default function MyProjectsPage() {
 return (
 <main className="relative z-10 bg-canvas min-h-screen">
 <Nav />
 <section className="pt-32 md:pt-40 pb-12 px-6 md:px-10">
 <div className="max-w-7xl mx-auto">
 <div className="flex items-center gap-2.5 mb-4">
 <div className="ai-pulse" />
 <span className="mono-label">your vision board</span>
 </div>
 <h1 className="font-display text-5xl md:text-6xl tracking-tight text-ink leading-[1.02] max-w-3xl">
 Your evolving <span className="italic text-signature">home roadmap.</span>
 </h1>
 <p className="mt-5 text-lg text-ink-600 max-w-xl">
 Every space you've asked Naili to read lives here. Resume a plan,
 compare revisions, or hand the brief to a matched pro.
 </p>
 </div>
 </section>
 <VisionBoardGrid />
 <Footer />
 </main>
 );
}
