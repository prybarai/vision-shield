'use client';

import { useState, use } from 'react';
import { CheckCircle, ArrowLeft, Clock3, ShieldCheck } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import posthog from 'posthog-js';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

const TIMING_OPTIONS = [
  { value: 'asap', label: 'ASAP', desc: 'I want to move quickly' },
  { value: 'within_month', label: 'Within a month', desc: 'I am collecting quotes soon' },
  { value: 'planning_ahead', label: 'Just planning', desc: 'I am not ready to hire yet' },
] as const;

const BUDGET_OPTIONS = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_15k', label: '$5,000 to $15,000' },
  { value: '15k_50k', label: '$15,000 to $50,000' },
  { value: '50k_plus', label: '$50,000+' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'budget', label: 'Budget', desc: 'Best price matters most' },
  { value: 'speed', label: 'Speed', desc: 'Fast turnaround matters most' },
  { value: 'quality', label: 'Quality', desc: 'Best craftsmanship matters most' },
] as const;

interface SubmitResponse {
  dispatch?: {
    webhook_configured?: boolean;
    mode?: 'saved_only' | 'dispatched' | 'dispatch_pending';
    message?: string;
  };
}

export default function ConnectPage({ params }: PageProps) {
  const { project_id } = use(params);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState('We saved your request and project details.');
  const [confirmationMode, setConfirmationMode] = useState<'saved_only' | 'dispatched' | 'dispatch_pending'>('saved_only');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    zip_code: '',
    preferred_timing: 'within_month',
    budget_range: '15k_50k',
    priority: 'quality',
    notes: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, project_id, source: 'prybar_vision' }),
      });

      const data = await res.json().catch(() => ({} as SubmitResponse));
      if (!res.ok) throw new Error(data && 'error' in data ? String(data.error) : 'Failed to submit');

      setConfirmationMessage(data.dispatch?.message || 'We saved your request and project details.');
      setConfirmationMode(data.dispatch?.mode || 'saved_only');
      posthog.capture('naili_lead_submitted', {
        source: 'vision',
        preferred_timing: form.preferred_timing,
        budget_range: form.budget_range,
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Request saved</h1>
        <p className="text-slate-600 text-lg mb-8">{confirmationMessage}</p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 text-left space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900 mb-2">What happens next</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2"><span className="text-blue-500">1.</span> Your project and contact details are saved.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500">2.</span> You can still use your estimate, materials plan, and brief right away.</li>
              <li className="flex items-start gap-2"><span className="text-blue-500">3.</span> Use Shield before hiring anyone, even if someone comes recommended.</li>
            </ul>
          </div>
          <div className="rounded-xl bg-white/70 p-4 text-sm text-slate-700 flex items-start gap-3">
            {confirmationMode === 'dispatched' ? (
              <Clock3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            )}
            <span>
              {confirmationMode === 'dispatched'
                ? 'Contractor routing was triggered successfully.'
                : 'No contractor outreach was triggered automatically unless routing was available.'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/shield/check" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Verify a contractor before hiring
          </Link>
          <Link href={`/vision/results/${project_id}`} className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
            Back to project results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <Link href={`/vision/results/${project_id}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a contractor match</h1>
        <p className="text-slate-600 leading-relaxed">
          Save this project for vetted-contractor follow-up. If routing is not live yet, we still keep your request cleanly on file without surprise outreach.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Your contact info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First name" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
            <Input label="Last name" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
          </div>
          <div className="mt-4 space-y-4">
            <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required hint="We will use this for project follow-up only." />
            <Input label="Phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 555-5555" required hint="Helpful if a vetted contractor is ready to reach out." />
            <Input label="Project ZIP code" value={form.zip_code} onChange={e => update('zip_code', e.target.value)} required hint="Usually the same ZIP used for your estimate." />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Project timing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIMING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('preferred_timing', opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${form.preferred_timing === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Budget range</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUDGET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('budget_range', opt.value)}
                className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-colors ${form.budget_range === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">What matters most?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('priority', opt.value)}
                className={`p-4 rounded-xl border-2 text-left sm:text-center transition-colors ${form.priority === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Anything a contractor should know? <span className="text-slate-400">(optional)</span></label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder="Examples: narrow work hours, existing damage, preferred materials, or anything you want included in the first conversation."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </Card>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Save request
        </Button>

        <p className="text-xs text-slate-500 text-center leading-relaxed">
          Submitting saves your request and preferences. Naili only triggers contractor outreach when routing is actually available.
        </p>
      </form>
    </div>
  );
}
