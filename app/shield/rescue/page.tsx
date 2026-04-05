'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle, Download, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Disclaimer from '@/components/ui/Disclaimer';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { US_STATES } from '@/types';

interface DisputeResult {
  dispute: {
    letter_demand: string;
    letter_ag_complaint: string;
    letter_bbb: string;
    letter_ftc: string;
    documentation_checklist: string[];
  };
}

const LETTER_LABELS = [
  { key: 'letter_demand', label: '📬 Demand Letter', desc: 'Formal demand to the contractor for resolution' },
  { key: 'letter_ag_complaint', label: '⚖️ AG Complaint', desc: 'Attorney General consumer protection complaint' },
  { key: 'letter_bbb', label: '📋 BBB Complaint', desc: 'Better Business Bureau complaint' },
  { key: 'letter_ftc', label: '🏛️ FTC Report', desc: 'Federal Trade Commission fraud report' },
];

export default function ShieldRescuePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DisputeResult | null>(null);
  const [activeTab, setActiveTab] = useState('letter_demand');
  const [acknowledged, setAcknowledged] = useState(false);

  const [form, setForm] = useState({
    situation_description: '',
    what_happened: '',
    contractor_name: '',
    contractor_business: '',
    contractor_phone: '',
    amount_paid: '',
    state: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledged) { setError('Please acknowledge the disclaimer.'); return; }
    if (!form.situation_description || !form.what_happened || !form.state || !form.amount_paid) {
      setError('Please fill in all required fields.'); return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shield/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation_description: form.situation_description,
          what_happened: form.what_happened,
          contractor_name: form.contractor_name,
          contractor_business: form.contractor_business,
          contractor_phone: form.contractor_phone,
          amount_paid: parseInt(form.amount_paid) || 0,
          state: form.state,
          acknowledged_not_legal_advice: acknowledged,
          session_id: uuidv4(),
        }),
      });
      if (!res.ok) throw new Error('Failed to generate');
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Failed to generate dispute documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLetter = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (result) {
    const { dispute } = result;
    const currentLetter = dispute[activeTab as keyof typeof dispute];

    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-semibold text-sm">Dispute package ready</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Your Documents</h1>
          </div>
          <button onClick={() => setResult(null)} className="text-sm text-slate-500 hover:text-slate-700">
            Generate new
          </button>
        </div>

        {/* Checklist */}
        {dispute.documentation_checklist?.length > 0 && (
          <Card className="mb-6">
            <h3 className="font-bold text-slate-900 mb-3">📋 Documentation Checklist</h3>
            <p className="text-sm text-slate-500 mb-3">Gather these before sending your letters:</p>
            <ul className="space-y-2">
              {dispute.documentation_checklist.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-slate-400 mt-0.5">□</span>{item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Letter tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {LETTER_LABELS.map((l) => (
            <button
              key={l.key}
              onClick={() => setActiveTab(l.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === l.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{LETTER_LABELS.find(l => l.key === activeTab)?.label}</h3>
              <p className="text-sm text-slate-500">{LETTER_LABELS.find(l => l.key === activeTab)?.desc}</p>
            </div>
            <button
              onClick={() => copyLetter(typeof currentLetter === 'string' ? currentLetter : '')}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Download className="h-4 w-4" /> Copy
            </button>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {typeof currentLetter === 'string' ? currentLetter : ''}
          </div>
        </Card>

        <Disclaimer text={DISCLAIMERS.dispute_letter} variant="warning" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">🆘 Get Help</h1>
        <p className="text-slate-500">Contractor ghosted you? Work unfinished? Get AI-generated dispute letters and complaint filings.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">If you believe you&apos;ve been a victim of criminal fraud, contact your local police department as well.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Situation overview</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What type of issue? <span className="text-red-500">*</span></label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="e.g. Contractor took deposit and never started work"
                value={form.situation_description}
                onChange={e => update('situation_description', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Describe what happened <span className="text-red-500">*</span></label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                placeholder="Provide as much detail as possible — dates, what was agreed, what they did or didn't do, how they've responded..."
                value={form.what_happened}
                onChange={e => update('what_happened', e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Contractor info</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contractor name" value={form.contractor_name} onChange={e => update('contractor_name', e.target.value)} />
              <Input label="Business name" value={form.contractor_business} onChange={e => update('contractor_business', e.target.value)} />
            </div>
            <Input label="Phone" type="tel" value={form.contractor_phone} onChange={e => update('contractor_phone', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Financial & location</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount paid ($)"
              type="number"
              min="0"
              placeholder="5000"
              value={form.amount_paid}
              onChange={e => update('amount_paid', e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
              <select
                className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.state}
                onChange={e => update('state', e.target.value)}
                required
              >
                <option value="">Select state...</option>
                {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Disclaimer text={DISCLAIMERS.dispute_letter} variant="warning" />

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            I understand these documents are AI-generated for informational purposes only and do not constitute legal advice. I will review them with a licensed attorney before sending.
          </span>
        </label>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!acknowledged}>
          Generate dispute package
        </Button>
      </form>
    </div>
  );
}
