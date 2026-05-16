import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request Submitted — Naili",
  description: "Your contractor matching request has been submitted. We'll connect you with qualified local pros.",
  robots: { index: false },
};

function formatCategory(cat?: string): string {
  if (!cat) return "home project";
  const map: Record<string, string> = {
    bathroom: "bathroom remodel",
    kitchen: "kitchen remodel",
    flooring: "flooring project",
    roofing: "roofing project",
    deck_patio: "deck & patio project",
    interior_paint: "interior painting project",
    exterior_paint: "exterior painting project",
    landscaping: "landscaping project",
    custom_project: "home project",
  };
  return map[cat] || cat.replace(/_/g, " ");
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { name?: string; category?: string };
}) {
  const name = searchParams.name || "there";
  const categoryLabel = formatCategory(searchParams.category);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center py-20">
          {/* Success animation */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-ink tracking-tight">
            You&apos;re all set, {name}!
          </h1>

          <p className="mt-4 text-lg text-ink/60 leading-relaxed">
            We&apos;re matching you with qualified contractors in your area
            who specialize in {categoryLabel}s. Expect to hear from 2-3 pros
            within 24 hours.
          </p>

          {/* What happens next */}
          <div className="mt-10 text-left space-y-4">
            <h2 className="text-sm font-semibold text-ink/40 uppercase tracking-wider">
              What happens next
            </h2>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "We review your project",
                  desc: "Our team reviews your photos and project details to find the best match.",
                },
                {
                  step: "2",
                  title: "Contractors reach out",
                  desc: "2-3 vetted local pros will contact you with availability and quotes.",
                },
                {
                  step: "3",
                  title: "You choose the best fit",
                  desc: "Compare quotes, read reviews, and pick the contractor that's right for you.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-hairline"
                >
                  <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center shrink-0 text-sm font-bold text-ink/50">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-ink/50 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/my-projects"
              className="px-6 py-3 rounded-xl bg-ink text-white font-semibold hover:bg-ink/90 transition text-center"
            >
              View my projects
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-hairline text-ink/70 font-medium hover:bg-ink/5 transition text-center"
            >
              Back to home
            </Link>
          </div>

          {/* Trust footer */}
          <p className="mt-8 text-xs text-ink/30">
            Your information is secure and will only be shared with vetted contractors.
            We never sell your data.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
