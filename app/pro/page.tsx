import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Briefcase, CheckCircle, Clock, MapPin, MessageSquare, Shield, Users } from 'lucide-react';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'For Contractors',
  description: 'Join the Naili contractor directory and receive better-scoped homeowner requests.',
  alternates: {
    canonical: absoluteUrl('/pro'),
  },
};

const BENEFIT_CARDS = [
  {
    icon: <Briefcase className="h-6 w-6" />,
    title: 'Complete Project Briefs',
    description: 'Every lead includes the homeowner photo, AI concept, verified scope flags, and walk-through questions.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Naili Verified Scope',
    description: 'Homeowners visually agree to the scope before you\'re contacted. No more "just getting quotes" calls.',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Homeowner Timeline',
    description: 'See if they\'re ready to start in 2 weeks or just gathering ideas for next year.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Clarification Q&A',
    description: 'Homeowners answer key questions upfront: "Wall coming down?" "Keeping existing floor?"',
  },
];

const BRIEF_PREVIEW_DATA = {
  homeownerName: 'Alex Johnson',
  projectType: 'Kitchen Refresh',
  zipCode: '94110',
  timeline: 'Ready in 2-4 weeks',
  budgetRange: '$25,000 - $40,000',
  styleVibes: ['Coffee Bar ☕', 'Modern 🏙️'],
  verifiedFlags: [
    'Keeping existing layout',
    'New cabinets + counters',
    'Flooring update',
    'Under-cabinet lighting',
  ],
  questions: [
    'Is there access to the backyard during work?',
    'Can we reuse the sink plumbing location?',
    'Preferred cabinet finish: painted or stained?',
  ],
};

export default function ProPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(72,199,241,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <span className="text-sm font-semibold">EXCLUSIVE CONTRACTOR PORTAL</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Stop Chasing Leads.
                <span className="block text-[#48c7f1]">Start Receiving Briefs.</span>
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-300 sm:text-xl">
                Naili homeowners arrive with visual concepts, verified scope, and clear budgets.
                The directory matches you with projects that are ready for serious conversation.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="#early-access"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-900 transition-all hover:scale-105 hover:bg-slate-100"
                >
                  Request Early Access <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-sm text-slate-400">Free during launch • No lead fees</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#1f7cf7]/20 to-[#48c7f1]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">Live Brief Preview</span>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">SAN FRANCISCO</span>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-xs text-slate-400">Project</div>
                      <div className="font-semibold">{BRIEF_PREVIEW_DATA.projectType}</div>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-xs text-slate-400">Timeline</div>
                      <div className="font-semibold">{BRIEF_PREVIEW_DATA.timeline}</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium">Verified Scope</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {BRIEF_PREVIEW_DATA.verifiedFlags.map((flag, index) => (
                        <span key={index} className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/10 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#48c7f1]" />
                      <span className="text-sm font-medium">Clarification Questions</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {BRIEF_PREVIEW_DATA.questions.map((question, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#48c7f1]" />
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Why Contractors Choose Naili
            </h2>
            <p className="mt-3 text-lg text-slate-400">
              Built for professionals who value their time and expertise
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_CARDS.map((benefit, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-4 inline-flex rounded-xl bg-white/10 p-3">
                  <div className="text-[#48c7f1]">{benefit.icon}</div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                <p className="text-sm text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-950 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                How the Network Works
              </h2>
              <p className="mt-3 text-lg text-slate-400">
                A quieter, more intentional matching model
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#1f7cf7] font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Homeowner Completes Brief</h4>
                    <p className="mt-1 text-slate-400">
                      They upload photos, pick style vibes, answer key questions, and get a visual concept.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#48c7f1] font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Naili Verifies Scope</h4>
                    <p className="mt-1 text-slate-400">
                      The AI identifies materials, estimates costs, and flags what's DIY vs pro territory.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Smart Contractor Matching</h4>
                    <p className="mt-1 text-slate-400">
                      Based on ZIP, trade specialty, and availability, 2-3 contractors receive the complete brief.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#1f7cf7]/10 to-emerald-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Directory Stats</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-slate-400">Current Promise</div>
                    <div className="text-2xl font-bold">No Spray-and-Pray</div>
                    <p className="mt-2 text-sm text-slate-400">
                      Leads are matched, not blasted. The goal is better conversations, not more calls.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-2xl font-bold">2-3</div>
                      <div className="text-sm text-slate-400">Contractors per brief</div>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <div className="text-2xl font-bold">24h</div>
                      <div className="text-sm text-slate-400">Average response time</div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-500/20 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                      <span className="font-semibold">Free During Launch</span>
                    </div>
                    <p className="mt-2 text-sm text-emerald-300">
                      No lead fees while we prove the matching quality and homeowner experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Form */}
      <section id="early-access" className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/20 bg-white/5 p-8 backdrop-blur-sm lg:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Request Early Access</h2>
              <p className="mt-3 text-slate-400">
                Join the contractor directory for your city. Free during launch.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Business Name</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-[#48c7f1] focus:outline-none"
                    placeholder="Your contracting business"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Primary Trade</label>
                  <select className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-[#48c7f1] focus:outline-none">
                    <option value="">Select your specialty</option>
                    <option value="kitchen">Kitchen Remodeling</option>
                    <option value="bathroom">Bathroom Remodeling</option>
                    <option value="painting">Painting</option>
                    <option value="flooring">Flooring</option>
                    <option value="deck">Deck & Patio</option>
                    <option value="roofing">Roofing</option>
                    <option value="general">General Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City & State</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-[#48c7f1] focus:outline-none"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-[#48c7f1] focus:outline-none"
                    placeholder="professional@yourbusiness.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  How do you currently receive leads? (Optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 focus:border-[#48c7f1] focus:outline-none"
                  rows={3}
                  placeholder="e.g., Angi, word of mouth, Houzz, etc."
                />
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">No commitment.</span> Early access is free during launch.
                      You'll receive briefs via email with the option to respond or pass.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-[#38BDF8] to-emerald-500 py-3.5 font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                Join the Directory
              </button>

              <p className="text-center text-sm text-slate-400">
                By submitting, you agree to receive briefs via email. You can unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
