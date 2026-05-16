"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Loader2,
} from "lucide-react";

interface Props {
  projectId?: string;
  zip?: string;
  category?: string;
  estimate?: string;
}

const TIMING_OPTIONS = [
  { value: "asap", label: "As soon as possible", icon: "⚡" },
  { value: "within_month", label: "Within the next month", icon: "📅" },
  { value: "planning_ahead", label: "Just planning ahead", icon: "🗓️" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "budget", label: "Best price", desc: "I want the most competitive quote" },
  { value: "speed", label: "Fastest timeline", desc: "I need this done quickly" },
  { value: "quality", label: "Highest quality", desc: "I want premium craftsmanship" },
] as const;

function formatCategory(cat?: string): string {
  if (!cat) return "Home Project";
  const map: Record<string, string> = {
    bathroom: "Bathroom Remodel",
    kitchen: "Kitchen Remodel",
    flooring: "Flooring",
    roofing: "Roofing",
    deck_patio: "Deck & Patio",
    interior_paint: "Interior Painting",
    exterior_paint: "Exterior Painting",
    landscaping: "Landscaping",
    custom_project: "Home Project",
  };
  return map[cat] || cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LeadCaptureForm({ projectId, zip, category, estimate }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ── form state ── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState(zip || "");
  const [timing, setTiming] = useState<string>("within_month");
  const [priority, setPriority] = useState<string>("quality");
  const [notes, setNotes] = useState("");

  /* ── auto-format phone ── */
  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 7) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`);
    } else if (digits.length >= 4) {
      setPhone(`(${digits.slice(0, 3)}) ${digits.slice(3)}`);
    } else {
      setPhone(digits);
    }
  }

  /* ── validation ── */
  function canAdvance(): boolean {
    if (step === 1) {
      return firstName.trim().length > 0 && lastName.trim().length > 0;
    }
    if (step === 2) {
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const phoneDigits = phone.replace(/\D/g, "");
      return emailValid && phoneDigits.length === 10;
    }
    if (step === 3) {
      return zipCode.replace(/\D/g, "").length === 5;
    }
    return true;
  }

  /* ── submit ── */
  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId || null,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          address: address.trim() || null,
          zip_code: zipCode.replace(/\D/g, "").slice(0, 5),
          preferred_timing: timing,
          priority,
          project_type: category || null,
          notes: notes.trim() || null,
          estimate_mid: estimate ? parseFloat(estimate) : null,
          source: "naili_get_quotes",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Something went wrong. Please try again.";
        const detail = data.detail ? ` (${data.detail})` : "";
        throw new Error(msg + detail);
      }

      const data = await res.json();
      router.push(`/get-quotes/success?name=${encodeURIComponent(firstName)}&category=${encodeURIComponent(category || "")}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const estimateNum = estimate ? parseFloat(estimate) : null;
  const categoryLabel = formatCategory(category);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20">
      {/* ── Header ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink/5 text-sm font-medium text-ink/70 mb-4">
          <ShieldCheck className="w-4 h-4" />
          Free · No obligation · No spam
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          Get matched with the right contractor
        </h1>
        <p className="mt-3 text-lg text-ink/60 max-w-lg mx-auto">
          Tell us a little about yourself and we&apos;ll connect you with vetted local pros
          who specialize in your type of project.
        </p>
      </div>

      {/* ── Project context card ── */}
      {(category || estimateNum) && (
        <div className="mb-8 p-4 rounded-2xl bg-white border border-hairline flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-ink/50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink">{categoryLabel}</p>
            {estimateNum && (
              <p className="text-sm text-ink/50">
                Estimated budget: ${estimateNum.toLocaleString()}
              </p>
            )}
          </div>
          {zip && (
            <div className="text-sm text-ink/50 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {zip}
            </div>
          )}
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-ink" : "bg-ink/10"
            }`}
          />
        ))}
      </div>

      {/* ── Step 1: Name ── */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              What&apos;s your name?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
                  autoFocus
                />
              </div>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Contact ── */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              How should contractors reach you?
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
                  autoFocus
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Address / ZIP ── */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              Where is the project?
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="text"
                  placeholder="Street address (optional)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
                  autoFocus
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  type="text"
                  placeholder="ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Timing & Priority ── */}
      {step === 4 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-3">
              When do you want to start?
            </label>
            <div className="grid gap-2">
              {TIMING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTiming(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    timing === opt.value
                      ? "border-ink bg-ink/5 text-ink font-medium"
                      : "border-hairline bg-white text-ink/70 hover:border-ink/30"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span>{opt.label}</span>
                  {timing === opt.value && (
                    <CheckCircle2 className="w-4 h-4 ml-auto text-ink" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-3">
              What matters most to you?
            </label>
            <div className="grid gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition ${
                    priority === opt.value
                      ? "border-ink bg-ink/5 text-ink"
                      : "border-hairline bg-white text-ink/70 hover:border-ink/30"
                  }`}
                >
                  <div>
                    <p className={`font-medium ${priority === opt.value ? "text-ink" : ""}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-ink/50">{opt.desc}</p>
                  </div>
                  {priority === opt.value && (
                    <CheckCircle2 className="w-4 h-4 ml-auto text-ink shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">
              Anything else the contractor should know? <span className="text-ink/30">(optional)</span>
            </label>
            <textarea
              placeholder="e.g., I'd like to keep the existing layout but upgrade all fixtures..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/30 transition resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 rounded-xl border border-hairline text-ink/70 hover:bg-ink/5 transition font-medium"
          >
            Back
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => canAdvance() && setStep(step + 1)}
            disabled={!canAdvance()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-white font-semibold hover:bg-ink/90 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canAdvance()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink text-white font-semibold hover:bg-ink/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get my free quotes
              </>
            )}
          </button>
        )}
      </div>

      {/* ── Trust signals ── */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink/40">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Your info is never sold
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Contractors respond within 24 hrs
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" /> 100% free, no obligation
        </span>
      </div>
    </div>
  );
}
