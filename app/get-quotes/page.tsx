import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { absoluteUrl } from "@/lib/site";
import LeadCaptureForm from "@/components/LeadCaptureForm";

export const metadata: Metadata = {
  title: "Get Free Contractor Quotes — Naili",
  description:
    "Tell us about your project and we'll connect you with vetted local contractors who are the right fit. Free, no obligation.",
  alternates: { canonical: absoluteUrl("/get-quotes") },
  openGraph: { url: absoluteUrl("/get-quotes") },
};

export default function GetQuotesPage({
  searchParams,
}: {
  searchParams: { project?: string; zip?: string; category?: string; estimate?: string };
}) {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-canvas">
        <LeadCaptureForm
          projectId={searchParams.project}
          zip={searchParams.zip}
          category={searchParams.category}
          estimate={searchParams.estimate}
        />
      </main>
      <Footer />
    </>
  );
}
