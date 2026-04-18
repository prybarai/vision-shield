'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, CheckCircle, Copy, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Disclaimer from '@/components/ui/Disclaimer';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { US_STATES } from '@/types';
import Link from 'next/link';
import posthog from 'posthog-js';

interface DisputeGenerated {
  demand_letter: string;
  ag_complaint: string;
  bbb_complaint: string;
  ftc_guidance: string;
  documentation_checklist: string[];
  small_claims_note: string;
}

const TABS = [
  { key: 'demand_letter', label: 'Demand letter', desc: 'A formal draft asking the contractor to resolve the issue.' },
  { key: 'ag_complaint', label: 'AG complaint', desc: 'A state attorney general complaint draft you can adapt.' },
  { key: 'bbb_complaint', label: 'BBB complaint', desc: 'A cleaner public-facing complaint draft.' },
  { key: 'ftc_guidance', label: 'FTC guidance', desc: 'Federal reporting and documentation guidance.' },
  { key: 'small_claims_note', label: 'Small claims note', desc: 'Notes on whether small claims may be worth considering.' },
] as const;

export default function ShieldRescuePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DisputeGenerated | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['key']>('demand_letter');
  const [acknowledged, setAcknowledged] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

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
    if (!acknowledged) {
      setError('Please acknowledge the disclaimer before generating documents.');
      return;
    }
    if (!form.situation_description || !form.what_happened || !form.state || !form.amount_paid) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setCopyStatus(null);

    try {
      const res = await fetch('/api/shield/generate-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation_description: form.situation_description,
          what_happened: form.what_happened,
          contractor_name: form.contractor_name,
          contractor_business: form.contractor_business,
          contractor_phone: form.contractor_phone,
          amount_paid: parseInt(form.amount_paid, 10) || 0,
          state: form.state,
          acknowledged_not_legal_advice: acknowledged,
          session_id: uuidv4(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      posthog.capture('shield_rescue_generated', {
        state: form.state,
        amount_paid: parseInt(form.amount_paid, 10) || 0,
      });
      setResult(data.generated || data.dispute);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to generate dispute documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Copied to clipboard.');
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      setCopyStatus('Copy failed. You may need to copy manually.');
    }
  };

  if (result) {
    const activeContent = result[activeTab];

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600 font-semibold text-sm">Dispute package ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Your documents</h1>
            <p className="text-sm text-slate-500 mt-1">Review everything carefully, add names, dates, and evidence, then send only what fits your situation.</p>
          </div>
          <button onClick={() => setResult(null)} className="text-sm text-slate-500 hover:text-slate-700">Generate new</button>
        </div>

        {result.documentation_checklist?.length > 0 && (
          <Card className="mb-6 p-5 sm:p-6">
            <h2 className="font-bold text-slate-900 mb-3">Documentation checklist</h2>
            <ul className="space-y-2">
              {result.documentation_checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-slate-400 mt-0.5">□</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.key ? 'bg-[#1f7cf7] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="mb-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-bold text-slate-900">{TABS.find(tab => tab.key === activeTab)?.label}</h2>
              <p className="text-sm text-slate-500">{TABS.find(tab => tab.key === activeTab)?.desc}</p>
            </div>
            <button onClick={() => copyText(String(activeContent || ''))} className="inline-flex items-center gap-1 text-sm text-[#1f7cf7] hover:text-[#0f5fc6] font-medium">
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap max-h-[28rem] overflow-y-auto leading-relaxed">
            {String(activeContent || '')}
          </div>
          {copyStatus && <p className="text-sm text-slate-500 mt-3">{copyStatus}</p>}
        </Card>

        <Card className="mb-4 bg-slate-900 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#d7f4ff] mb-2">
            <ShieldCheck className="h-4 w-4" />
            After you send this
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">Keep your timeline, receipts, screenshots, and contract together. If you move forward with someone new, start fresh with a cleaner vetting path.</p>
          <Link href="/connect" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
            Request vetted options
          </Link>
        </Card>

        <Disclaimer text={DISCLAIMERS.dispute_letter} variant="warning" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Get dispute help</h1>
        <p className="text-slate-600 leading-relaxed">
          Describe what happened and generate a calmer, more organized dispute package. This is best for documenting the issue and preparing next steps, not replacing a lawyer.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-6">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">If you believe you&apos;ve been a victim of criminal fraud, contact your local police department too.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Situation overview</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What type of issue? <span className="text-red-500">*</span></label>
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1] resize-none" rows={2} placeholder="e.g. Contractor took deposit and never started work" value={form.situation_description} onChange={e => update('situation_description', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Describe what happened <span className="text-red-500">*</span></label>
              <textarea className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1] resize-none" rows={6} placeholder="Include dates, what was promised, what was paid, what is unfinished, and any communication issues..." value={form.what_happened} onChange={e => update('what_happened', e.target.value)} required />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Contractor info</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Contractor name" value={form.contractor_name} onChange={e => update('contractor_name', e.target.value)} />
              <Input label="Business name" value={form.contractor_business} onChange={e => update('contractor_business', e.target.value)} />
            </div>
            <Input label="Phone" type="tel" value={form.contractor_phone} onChange={e => update('contractor_phone', e.target.value)} />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Financial and location details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Amount paid ($)" type="number" min="0" placeholder="5000" value={form.amount_paid} onChange={e => update('amount_paid', e.target.value)} required />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
              <select className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#48c7f1]" value={form.state} onChange={e => update('state', e.target.value)} required>
                <option value="">Select state...</option>
                {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </Card>

        <Disclaimer text={DISCLAIMERS.dispute_letter} variant="warning" />

        <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-slate-200 bg-white p-4">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1f7cf7] focus:ring-[#48c7f1]" />
          <span className="text-sm text-slate-700">I understand these documents are AI-generated for informational purposes only and do not constitute legal advice. I will review them carefully before sending.</span>
        </label>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Generate dispute package
        </Button>
      </form>
    </div>
  );
}
