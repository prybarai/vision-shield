import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
 title: "Privacy Policy — Naili",
 description: "How Naili handles your data, photos, and personal information.",
};

export default function PrivacyPage() {
 return (
  <main className="relative z-10 min-h-screen bg-canvas">
   <Nav />
   <section className="px-6 pb-16 pt-32 md:px-10 md:pt-40">
    <div className="mx-auto max-w-3xl">
     <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
      Privacy Policy
     </h1>
     <p className="mt-4 text-lg text-ink-600">
      Last updated: May 2026
     </p>

     <div className="mt-12 space-y-10 text-ink-600 leading-relaxed">
      <section>
       <h2 className="font-display text-2xl tracking-tight text-ink mb-4">
        What we collect
       </h2>
       <p>
        When you use Naili, we collect the photos you upload, the ZIP code you provide, and basic usage data to improve the experience. We do not sell your personal information to third parties.
       </p>
      </section>

      <section>
       <h2 className="font-display text-2xl tracking-tight text-ink mb-4">
        How we use your photos
       </h2>
       <p>
        Photos you upload are used exclusively for AI analysis to generate your project plan, cost estimates, and design concepts. They are stored securely and are not shared publicly unless you choose to share your project link.
       </p>
      </section>

      <section>
       <h2 className="font-display text-2xl tracking-tight text-ink mb-4">
        Analytics
       </h2>
       <p>
        We use PostHog for product analytics to understand how people use Naili and improve the experience. This data is anonymized and used only for product improvement.
       </p>
      </section>

      <section>
       <h2 className="font-display text-2xl tracking-tight text-ink mb-4">
        Data storage
       </h2>
       <p>
        Your project data is stored securely using Supabase infrastructure. You can request deletion of your data at any time by contacting us.
       </p>
      </section>

      <section>
       <h2 className="font-display text-2xl tracking-tight text-ink mb-4">
        Contact
       </h2>
       <p>
        For privacy-related questions, reach us at{" "}
        <a
         href="mailto:privacy@naili.ai"
         className="font-medium text-sand-dark hover:text-sand transition"
        >
         privacy@naili.ai
        </a>
        .
       </p>
      </section>
     </div>
    </div>
   </section>
   <Footer />
  </main>
 );
}
