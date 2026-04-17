import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import VisionStartFlow from '@/components/vision/VisionStartFlow';

export default function VisionStartPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10">
      <div className="mx-auto mb-6 max-w-5xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#d7f4ff] bg-[linear-gradient(135deg,rgba(31,124,247,0.08),rgba(72,199,241,0.08),rgba(168,235,87,0.12))] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5fc6]">
                <Sparkles className="h-3.5 w-3.5" /> rebuild beta
              </div>
              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Try the new interior painting estimator walkthrough</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                This is the first session-driven walkthrough shell for the Naili rebuild. It starts the move from the old planner into the contractor-style virtual estimator flow.
              </p>
            </div>
            <Link href="/estimate/interior-paint" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1f7cf7_0%,#48c7f1_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(31,124,247,0.22)] transition-opacity hover:opacity-95">
              Launch beta walkthrough <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <VisionStartFlow />
    </div>
  );
}
