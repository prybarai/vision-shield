"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Eye,
  Download,
  Share2,
  Repeat,
  CheckCircle,
  Camera,
  ScanSearch,
  Route,
  ClipboardList,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Upload anything",
    description: "Photo of any home project, issue, or idea.",
    icon: Camera,
    highlight: "AI understands rooms, yards, plumbing, electrical, and more.",
  },
  {
    id: 2,
    title: "AI diagnosis",
    description: "Our AI analyzes what you're showing and understands the need.",
    icon: ScanSearch,
    highlight: "Identifies issues, suggests solutions, shows possibilities.",
  },
  {
    id: 3,
    title: "Your path forward",
    description: "DIY weekend project or hire a pro? We give you both options.",
    icon: Route,
    highlight: "Materials list with purchase options or pro matching.",
  },
  {
    id: 4,
    title: "Complete plan",
    description: "Cost estimate, timeline, materials, and next steps.",
    icon: ClipboardList,
    highlight: "Everything you need to decide and execute.",
  },
];

const magicMoments = [
  {
    title: "AI diagnoses plumbing, electrical, structural issues",
    detail: "Our AI analyzes layout, lighting, and potential",
  },
  {
    title: "See your yard transformed with landscaping ideas",
    detail: "No waiting for renders — see changes instantly",
  },
  {
    title: "Get DIY instructions tailored to your skill level",
    detail: "Based on actual local contractor rates",
  },
  {
    title: "Compare pro bids with AI-generated specifications",
    detail: "Clear scope = better bids, less confusion",
  },
];

export default function AddictiveFlow() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-sand/5 via-transparent to-mint/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(216,185,138,0.08),transparent_50%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-panel bg-canvas-50/80 px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-sand-dark" />
            <span className="text-sm font-semibold text-ink-600">How it works</span>
          </div>
          <h2 className="font-display text-4xl leading-tight tracking-tight text-ink md:text-5xl">
            Diagnose. Plan. <span className="italic text-signature">Execute.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-600">
            Upload a photo, get an AI-powered diagnosis, and walk away with a complete plan — whether you DIY or hire a pro.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: step.id * 0.1 }}
              onMouseEnter={() => setHoveredStep(step.id)}
              onMouseLeave={() => setHoveredStep(null)}
              className={`relative rounded-3xl border border-hairline bg-canvas-50/80 p-6 backdrop-blur-sm transition-all duration-300 ${
                hoveredStep === step.id ? "shadow-lift -translate-y-1 border-panel" : "shadow-soft"
              }`}
            >
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sand/15">
                  <step.icon className="h-6 w-6 text-sand-dark" />
                </div>
                <h3 className="font-display text-xl tracking-tight text-ink mb-2">{step.title}</h3>
                <p className="text-sm text-ink-600 mb-3">{step.description}</p>
                <div className="flex items-center gap-2 text-xs font-medium text-ink-500">
                  <Zap className="h-3 w-3" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Magic Moments */}
        <div className="rounded-3xl border border-hairline bg-gradient-to-br from-canvas-50 to-canvas-100 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-sand/20 p-2">
              <Sparkles className="h-5 w-5 text-sand-dark" />
            </div>
            <h3 className="font-display text-2xl tracking-tight text-ink">Where the magic happens</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {magicMoments.map((moment, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="rounded-full bg-mint/20 p-1.5 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-mint" />
                </div>
                <div>
                  <p className="font-medium text-ink">{moment.title}</p>
                  <p className="text-sm text-ink-500 mt-1">{moment.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="rounded-full border border-panel bg-canvas-50 px-4 py-2 text-sm font-medium text-ink-600">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                No credit card needed
              </span>
            </div>
            <div className="rounded-full border border-panel bg-canvas-50 px-4 py-2 text-sm font-medium text-ink-600">
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export anytime
              </span>
            </div>
            <div className="rounded-full border border-panel bg-canvas-50 px-4 py-2 text-sm font-medium text-ink-600">
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share with one click
              </span>
            </div>
            <div className="rounded-full border border-panel bg-canvas-50 px-4 py-2 text-sm font-medium text-ink-600">
              <span className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Try unlimited rooms
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="#upload"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              <Sparkles className="h-5 w-5" />
              Try AI home analysis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="text-sm text-ink-500">
              Thousands of homeowners have already started their next project here.
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mt-16 rounded-3xl border border-sand/30 bg-gradient-to-br from-sand/10 to-mint/10 p-8 text-center"
        >
          <p className="text-lg font-medium text-ink">
            &ldquo;I showed it a leaky faucet. It gave me the repair parts list and three local plumbers.&rdquo;
          </p>
          <p className="mt-3 text-sm text-ink-600">
            Real AI that helps with real home problems — from quick fixes to full renovations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
