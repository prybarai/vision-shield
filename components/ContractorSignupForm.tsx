'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  User,
  Building2,
  Wrench,
  MapPin,
  ExternalLink,
} from 'lucide-react';

const TRADES = [
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'deck_patio', label: 'Deck & Patio' },
  { id: 'landscaping', label: 'Landscaping' },
  { id: 'exterior_paint', label: 'Exterior Paint' },
  { id: 'interior_paint', label: 'Interior Paint' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'windows_doors', label: 'Windows & Doors' },
  { id: 'siding', label: 'Siding' },
  { id: 'general', label: 'General Contractor' },
];

type Step = 'contact' | 'business' | 'trades' | 'success';

export default function ContractorSignupForm() {
  const [step, setStep] = useState<Step>('contact');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Contact fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Business fields
  const [companyName, setCompanyName] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Trade fields
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [serviceZips, setServiceZips] = useState('');

  const toggleTrade = (id: string) => {
    setSelectedTrades((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const canAdvanceContact = firstName.trim() && lastName.trim() && email.trim();
  const canAdvanceBusiness = true; // all optional
  const canSubmit = selectedTrades.length > 0 && serviceZips.trim();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contractors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          company_name: companyName.trim() || null,
          years_experience: yearsExperience || null,
          license_number: licenseNumber.trim() || null,
          website_url: websiteUrl.trim() || null,
          trades: selectedTrades,
          service_zip_codes: serviceZips,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = step === 'contact' ? 0 : step === 'business' ? 1 : step === 'trades' ? 2 : 3;

  if (step === 'success') {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-stone-800">
          You&apos;re on the list!
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-stone-500">
          We&apos;ll review your information and reach out when we&apos;re active in your area.
          In the meantime, check out our contractor management tool.
        </p>
        <a
          href="https://www.prybar.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-stone-900 active:scale-95"
        >
          Explore Prybar.ai
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs text-stone-400">
          Prybar is our contractor management platform — manage bids, clients, and projects.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step progress */}
      <div className="mb-6 sm:mb-8 flex items-center gap-2">
        {['Contact', 'Business', 'Trades'].map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < stepIndex
                      ? 'bg-emerald-500 text-white'
                      : i === stepIndex
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-200 text-stone-400'
                  }`}
                >
                  {i < stepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= stepIndex ? 'text-stone-700' : 'text-stone-400'}`}>
                  {label}
                </span>
              </div>
              <div className="h-1 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stone-800 transition-all duration-500"
                  style={{ width: i < stepIndex ? '100%' : i === stepIndex ? '50%' : '0%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step: Contact */}
      {step === 'contact' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-800">Your contact info</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">First name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Last name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>
          <button
            onClick={() => setStep('business')}
            disabled={!canAdvanceContact}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-stone-900 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step: Business */}
      {step === 'business' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-800">Business details</h3>
          </div>
          <p className="text-sm text-stone-500 -mt-1">All fields are optional — share what you&apos;re comfortable with.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Smith Renovations LLC"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">Years of experience</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder="10"
                min="0"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-600">License number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-600">Website</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://smithrenovations.com"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep('contact')}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-base font-medium text-stone-600 transition hover:bg-stone-50 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={() => setStep('trades')}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-stone-900 active:scale-95"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step: Trades & Service Area */}
      {step === 'trades' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="h-5 w-5 text-stone-400" />
            <h3 className="text-lg font-semibold text-stone-800">Trades & service area</h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-600">
              What trades do you cover? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRADES.map((trade) => {
                const selected = selectedTrades.includes(trade.id);
                return (
                  <button
                    key={trade.id}
                    onClick={() => toggleTrade(trade.id)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition active:scale-95 ${
                      selected
                        ? 'border-stone-800 bg-stone-800 text-white shadow-md'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50'
                    }`}
                  >
                    {trade.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-stone-400" />
              <label className="text-sm font-medium text-stone-600">ZIP codes you serve *</label>
            </div>
            <input
              type="text"
              value={serviceZips}
              onChange={(e) => setServiceZips(e.target.value)}
              placeholder="95118, 95120, 95123"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
            <p className="mt-1 text-xs text-stone-400">Separate multiple ZIP codes with commas</p>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setStep('business')}
              className="flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-base font-medium text-stone-600 transition hover:bg-stone-50 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-stone-800 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-stone-900 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit request <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
