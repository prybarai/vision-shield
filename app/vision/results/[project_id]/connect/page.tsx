'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ project_id: string }>;
}

const TIMING_OPTIONS = [
  { value: 'asap', label: 'ASAP', desc: 'I need this done soon' },
  { value: 'within_month', label: 'Within a month', desc: 'Planning ahead but moving quickly' },
  { value: 'planning_ahead', label: 'Just planning', desc: 'Getting quotes, no rush' },
];

const BUDGET_OPTIONS = [
  { value: 'under_5k', label: 'Under $5,000' },
  { value: '5k_15k', label: '$5,000 – $15,000' },
  { value: '15k_50k', label: '$15,000 – $50,000' },
  { value: '50k_plus', label: '$50,000+' },
];

const PRIORITY_OPTIONS = [
  { value: 'budget', label: '💰 Budget', desc: 'Best price wins' },
  { value: 'speed', label: '⚡ Speed', desc: 'I need it done fast' },
  { value: 'quality', label: '⭐ Quality', desc: 'Best craftsmanship' },
];

export default function ConnectPage({ params }: PageProps) {
  const { project_id } = use(params);
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">You&apos;re all set!</h1>
        <p className="text-slate-500 text-lg mb-8">
          We saved your request. A vetted contractor match or follow-up can happen once dispatch is available.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-slate-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-blue-500">1.</span> Your request is saved immediately</li>
            <li className="flex items-start gap-2"><span className="text-blue-500">2.</span> Matching and dispatch happen when contractor routing is available</li>
            <li className="flex items-start gap-2"><span className="text-blue-500">3.</span> You can keep using Shield while you wait</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/shield/check" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Verify contractors before hiring →
          </Link>
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
            View my projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href={`/vision/results/${project_id}`} className="flex items-center gap-1 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Request a contractor match</h1>
      <p className="text-slate-500 mb-8">Share your details to save this project for vetted-contractor follow-up when routing is available. No surprise outreach.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Your contact info</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={form.first_name} onChange={e => update('first_name', e.target.value)} required />
            <Input label="Last name" value={form.last_name} onChange={e => update('last_name', e.target.value)} required />
          </div>
          <div className="mt-4 space-y-4">
            <Input label="Email" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
            <Input label="Phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 555-5555" required />
            <Input label="ZIP code" value={form.zip_code} onChange={e => update('zip_code', e.target.value)} required />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Project timing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIMING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('preferred_timing', opt.value)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  form.preferred_timing === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Budget range</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUDGET_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('budget_range', opt.value)}
                className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-colors ${
                  form.budget_range === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">What matters most?</h3>
          <div className="grid grid-cols-3 gap-3">
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('priority', opt.value)}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  form.priority === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <label className="block text-sm font-medium text-slate-700 mb-2">Additional notes <span className="text-slate-400">(optional)</span></label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Anything else contractors should know..."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </Card>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Submit project — connect me with contractors
        </Button>

        <p className="text-xs text-slate-400 text-center">
          Submitting saves your request for vetted follow-up. Prybar will not trigger contractor outreach until routing is actually available.
        </p>
      </form>
    </div>
  );
}
