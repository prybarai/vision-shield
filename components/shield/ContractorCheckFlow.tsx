'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Disclaimer from '@/components/ui/Disclaimer';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { getRiskColor, getRiskBgColor, getRiskLabel, cn } from '@/lib/utils';
import { US_STATES } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, ShieldAlert, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Step = 'form' | 'questionnaire' | 'results';

const QUESTIONNAIRE = [
  { key: 'q1_unsolicited', question: 'Did this contractor approach you unsolicited, like door-to-door or after seeing neighborhood work?' },
  { key: 'q2_upfront', question: 'Are they asking for a large upfront payment before meaningful work starts?' },
  { key: 'q3_cash_only', question: 'Are they asking to be paid only in cash?' },
  { key: 'q4_no_contract', question: 'Are they avoiding or refusing a written contract?' },
  { key: 'q5_low_bid', question: 'Is their quote much lower than other quotes you received?' },
  { key: 'q6_no_insurance', question: 'Have they failed to show proof of insurance?' },
  { key: 'q7_pressure', question: 'Are they pressuring you to sign or pay immediately?' },
  { key: 'q8_no_permits', question: 'Did they suggest permits are unnecessary for this work?' },
];

interface LicenseResult {
  status: 'active' | 'expired' | 'not_found' | 'fallback' | 'error';
  licenseNumber?: string;
  licenseType?: string;
  expiresAt?: string;
  businessName?: string;
  boardName?: string;
  boardUrl?: string;
  fallbackMessage?: string;
  error?: string;
}

interface ScanResult {
  scan: Record<string, unknown> | null;
  license: LicenseResult;
  risk: {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    risk_flags: Array<{ flag: string; explanation: string; severity: string }>;
    next_steps: string[];
  };
}

export default function ContractorCheckFlow() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licensePreview, setLicensePreview] = useState<LicenseResult | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const [form, setForm] = useState({
    contractor_name: '',
    contractor_phone: '',
    contractor_business_name: '',
    contractor_website: '',
    contractor_license_number: '',
    state: '',
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const updateAnswer = (key: string, value: string) => setAnswers(prev => ({ ...prev, [key]: value }));

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contractor_business_name.trim()) {
      setError('Please enter the contractor business name.');
      return;
    }
    if (!form.state) {
      setError('Please select a state.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shield/check-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, preview_only: true }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || 'Lookup failed');
      }

      const data = await res.json();
      setLicensePreview(data.license);
      setStep('questionnaire');
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Failed to check license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shield/check-contractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          questionnaire_answers: answers,
          session_id: uuidv4(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
      setStep('results');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to run check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('form');
    setResult(null);
    setLicensePreview(null);
    setAnswers({});
    setError(null);
  };

  const licenseStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="green">Verified license found</Badge>;
      case 'expired': return <Badge variant="amber">License found but not active</Badge>;
      case 'fallback': return <Badge variant="gray">Manual verification needed</Badge>;
      case 'not_found': return <Badge variant="red">No license found</Badge>;
      default: return <Badge variant="gray">Verification unavailable</Badge>;
    }
  };

  const renderLicenseCard = (license: LicenseResult) => (
    <Card className="mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-slate-900 mb-1">License check</h3>
          <p className="text-sm text-slate-500">We try automatic verification first, then fall back to the state board if needed.</p>
        </div>
        {licenseStatusBadge(license.status)}
      </div>

      {license.status === 'active' && (
        <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Good sign. An active license lowers risk, but you should still review insurance, contract terms, payment structure, and references.
        </div>
      )}

      {license.status === 'not_found' && (
        <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Higher caution. No automatic license match was found. Double-check the business name, ask for the license number directly, and verify on the state board before paying a deposit.
        </div>
      )}

      {license.status === 'fallback' ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">{license.fallbackMessage || 'We could not automatically verify this license.'}</p>
              {license.boardName && <p className="text-sm text-amber-800 mt-1">Check directly with {license.boardName}.</p>}
              {license.boardUrl && (
                <a href={license.boardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-900 underline">
                  Open state board verification <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-sm text-slate-600">
          {license.businessName && <p><strong>Business:</strong> {license.businessName}</p>}
          {license.licenseNumber && <p><strong>License #:</strong> {license.licenseNumber}</p>}
          {license.licenseType && <p><strong>Type:</strong> {license.licenseType}</p>}
          {license.expiresAt && <p><strong>Expires:</strong> {license.expiresAt}</p>}
          {license.boardName && <p><strong>Board:</strong> {license.boardName}</p>}
          {license.boardUrl && (
            <a href={license.boardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2">
              Verify on board website <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </Card>
  );

  if (step === 'form') {
    return (
      <form onSubmit={handleLookup}>
        <Card className="space-y-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contractor name"
              placeholder="John Smith"
              value={form.contractor_name}
              onChange={e => updateForm('contractor_name', e.target.value)}
            />
            <Input
              label="Business name"
              placeholder="Smith Construction LLC"
              value={form.contractor_business_name}
              onChange={e => updateForm('contractor_business_name', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={form.contractor_phone}
              onChange={e => updateForm('contractor_phone', e.target.value)}
            />
            <Input
              label="License number"
              placeholder="Optional but helpful"
              value={form.contractor_license_number}
              onChange={e => updateForm('contractor_license_number', e.target.value)}
            />
          </div>
          <Input
            label="Website"
            type="url"
            placeholder="https://example.com"
            value={form.contractor_website}
            onChange={e => updateForm('contractor_website', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">State <span className="text-red-500">*</span></label>
            <select
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.state}
              onChange={e => updateForm('state', e.target.value)}
              required
            >
              <option value="">Select state...</option>
              {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </Card>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{error}</div>}
        <Disclaimer text={DISCLAIMERS.license_result} className="mb-4" />
        <Button type="submit" className="w-full" size="lg" loading={loading}>Check license and continue</Button>
      </form>
    );
  }

  if (step === 'questionnaire' && licensePreview) {
    const allAnswered = QUESTIONNAIRE.every(q => answers[q.key]);
    return (
      <div>
        <button onClick={() => setStep('form')} className="text-slate-500 hover:text-slate-700 text-sm mb-6 flex items-center gap-1">
          ← Back
        </button>

        {renderLicenseCard(licensePreview)}

        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Next, answer a few trust and payment questions. This helps turn the license result into a calmer, more practical risk read, especially when verification is incomplete.
        </div>

        <Card className="mb-4">
          <h3 className="font-bold text-slate-900 mb-4">Risk questionnaire</h3>
          <p className="text-sm text-slate-500 mb-6">Answer these based on what the contractor has actually said or done so far.</p>
          <div className="space-y-4">
            {QUESTIONNAIRE.map((q) => (
              <div key={q.key} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <p className="text-sm text-slate-700 flex-1">{q.question}</p>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                  {[
                    { value: 'yes', label: 'Yes' },
                    { value: 'no', label: 'No' },
                    { value: 'not_sure', label: 'Not sure' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateAnswer(q.key, option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                        answers[q.key] === option.value
                          ? option.value === 'yes' ? 'bg-red-500 text-white border-red-500'
                            : option.value === 'no' ? 'bg-green-500 text-white border-green-500'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{error}</div>}
        <Button className="w-full" size="lg" onClick={handleFinalSubmit} loading={loading} disabled={!allAnswered}>
          Finish contractor check
        </Button>
      </div>
    );
  }

  if (step === 'results' && result) {
    const { license, risk } = result;
    const riskLevel = risk.risk_level;

    return (
      <div className="space-y-6">
        <Card className={cn('border', getRiskBgColor(riskLevel))}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Contractor check result</p>
              <h3 className="font-bold text-slate-900 text-lg">Risk assessment</h3>
            </div>
            <Badge variant={riskLevel === 'low' ? 'green' : riskLevel === 'medium' ? 'amber' : 'red'}>
              {getRiskLabel(riskLevel)}
            </Badge>
          </div>
          <p className="text-sm text-slate-700 mb-4">
            {riskLevel === 'low'
              ? 'This contractor currently shows fewer obvious warning signs based on the information provided. Keep using normal contractor diligence before signing.'
              : riskLevel === 'medium'
              ? 'There are meaningful caution signs here. Slow down, tighten the paperwork, and verify the open questions before paying or signing.'
              : 'There are serious warning signs here. I would avoid paying more money until you independently verify licensing, insurance, scope, and payment terms.'}
          </p>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={riskLevel === 'low' ? '#22c55e' : riskLevel === 'medium' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="3"
                  strokeDasharray={`${risk.risk_score}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-900">{risk.risk_score}</span>
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getRiskColor(riskLevel)}`}>{getRiskLabel(riskLevel)}</div>
              <div className="text-sm text-slate-500">Risk score out of 100</div>
            </div>
          </div>
        </Card>

        {renderLicenseCard(license)}

        {risk.risk_flags?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Triggered flags</h3>
            <div className="space-y-3">
              {risk.risk_flags.map((flag, i) => (
                <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl', flag.severity === 'high' ? 'bg-red-50' : 'bg-amber-50')}>
                  {flag.severity === 'high'
                    ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    : <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{flag.flag}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{flag.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {risk.next_steps?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Recommended next steps</h3>
            <ul className="space-y-2">
              {risk.next_steps.map((stepItem, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{stepItem}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="bg-slate-900 text-white">
          <h3 className="font-bold text-lg mb-2">Recommended next move</h3>
          <p className="text-sm text-slate-300 mb-4">
            If this result still feels uneasy, move to a cleaner quote path or compare against a vetted contractor option before sending more money.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shield/scan" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
              Scan their quote next
            </Link>
            <Link href="/connect" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Find vetted contractors
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <Disclaimer text={DISCLAIMERS.license_result} />
          <Disclaimer text={DISCLAIMERS.not_for_employment} variant="warning" />
        </div>

        <Button variant="secondary" className="w-full" onClick={resetFlow}>
          Check another contractor
        </Button>
      </div>
    );
  }

  return null;
}
