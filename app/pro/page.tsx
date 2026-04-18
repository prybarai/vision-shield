import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProHero from "@/components/ProHero";
import LeadBriefPreview from "@/components/LeadBriefPreview";
import ProStats from "@/components/ProStats";
import ProAccessForm from "@/components/ProAccessForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Naili Pro — Stop chasing leads. Start receiving briefs.",
 description:
 "Naili Pro delivers verified-scope project briefs to the contractors that actually fit the job. No spam, just the brief.",
};

export default function ProPage() {
 return (
 <main className="relative z-10 bg-graphite-700 text-canvas-50 min-h-screen">
 {/* Dark blueprint grid backdrop */}
 <div className="fixed inset-0 pointer-events-none -z-0">
 <div
 className="absolute inset-0 opacity-50"
 style={{
 backgroundImage:
 "linear-gradient(rgba(124,144,176,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,144,176,0.08) 1px, transparent 1px)",
 backgroundSize: "56px 56px",
 maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
 WebkitMaskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
 }}
 />
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[80vh] bg-radial-cool opacity-50" />
 </div>

 <Nav />
 <ProHero />
 <ProStats />
 <LeadBriefPreview />
 <ProAccessForm />
 <Footer />
 </main>
 );
}
