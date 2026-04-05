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
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

type Step = 'form' | 'questionnaire' | 'results';

const QUESTIONNAIRE = [
  { key: 'has_license', question: 'Did the contractor provide a license number?' },
  { key: 'has_insurance', question: 'Did they show proof of insurance (liability + workers comp)?' },
  { key: 'written_contract', question: 'Are they willing to provide a written contract?' },
  { key: 'no_large_upfront', question: 'Are they asking for less than 30% upfront?' },
  { key: 'has_references', question: 'Did they offer references from recent jobs?' },
  { key: 'has_local_address', question: 'Do they have a verifiable local business address?' },
  { key: 'no_cash_only', question: 'Are they accepting payment methods other than cash only?' },
];

interface ScanResult {
  scan: Record<string, unknown>;
  license: {
    status: string;
    licenseNumber?: string;
    licenseType?: string;
    expiresAt?: string;
    boardName?: string;
    boardUrl?: string;
    error?: string;
  };
  risk: {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    risk_flags: Array<{ flag: string; explanation: string; severity: string }>;
  };
}

export default function ContractorCheckFlow() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.state) { setError('Please select a state.'); return; }
    setError(null);
    setStep('questionnaire');
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
      if (!res.ok) throw new Error('Check failed');
      const data = await res.json();
      setResult(data);
      setStep('results');
    } catch {
      setError('Failed to run check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const licenseStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="green">✓ Active License</Badge>;
      case 'expired': return <Badge variant="amber">⚠ Expired License</Badge>;
      case 'not_found': return <Badge variant="red">✗ Not Found</Badge>;
      default: return <Badge variant="gray">Unknown</Badge>;
    }
  };

  if (step === 'form') {
    return (
      <form onSubmit={handleFormSubmit}>
        <Card className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
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
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={form.contractor_phone}
              onChange={e => updateForm('contractor_phone', e.target.value)}
            />
            <Input
              label="License number"
              placeholder="Optional but recommended"
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
        <Button type="submit" className="w-full" size="lg">Continue to questionnaire</Button>
      </form>
    );
  }

  if (step === 'questionnaire') {
    const allAnswered = QUESTIONNAIRE.every(q => answers[q.key]);
    return (
      <div>
        <button onClick={() => setStep('form')} className="text-slate-500 hover:text-slate-700 text-sm mb-6 flex items-center gap-1">
          ← Back
        </button>
        <Card className="mb-4">
          <h3 className="font-bold text-slate-900 mb-4">Contractor questionnaire</h3>
          <p className="text-sm text-slate-500 mb-6">Answer these questions based on your conversations with the contractor.</p>
          <div className="space-y-4">
            {QUESTIONNAIRE.map((q) => (
              <div key={q.key} className="flex items-start justify-between gap-4">
                <p className="text-sm text-slate-700 flex-1">{q.question}</p>
                <div className="flex gap-2 flex-shrink-0">
                  {['yes', 'no', 'unsure'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateAnswer(q.key, val)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize',
                        answers[q.key] === val
                          ? val === 'yes' ? 'bg-green-500 text-white border-green-500'
                            : val === 'no' ? 'bg-red-500 text-white border-red-500'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{error}</div>}
        <Button
          className="w-full"
          size="lg"
          onClick={handleFinalSubmit}
          loading={loading}
          disabled={!allAnswered}
        >
          Run contractor check
        </Button>
      </div>
    );
  }

  if (step === 'results' && result) {
    const { license, risk } = result;
    const riskLevel = risk.risk_level;

    return (
      <div className="space-y-6">
        {/* Risk Score */}
        <Card className={cn('border', getRiskBgColor(riskLevel))}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Risk Assessment</h3>
            <Badge variant={riskLevel === 'low' ? 'green' : riskLevel === 'medium' ? 'amber' : 'red'}>
              {getRiskLabel(riskLevel)}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#e2e8f0" strokeWidth="3"
                />
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

        {/* License Result */}
        <Card>
          <h3 className="font-bold text-slate-900 mb-3">License Check</h3>
          <div className="flex items-center gap-3 mb-3">
            {licenseStatusBadge(license.status)}
          </div>
          {license.licenseNumber && <p className="text-sm text-slate-600 mb-1">License #: <strong>{license.licenseNumber}</strong></p>}
          {license.licenseType && <p className="text-sm text-slate-600 mb-1">Type: {license.licenseType}</p>}
          {license.expiresAt && <p className="text-sm text-slate-600 mb-1">Expires: {license.expiresAt}</p>}
          {license.boardName && <p className="text-sm text-slate-600 mb-1">Board: {license.boardName}</p>}
          {license.boardUrl && (
            <a href={license.boardUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
              Verify on board website →
            </a>
          )}
          {license.status === 'not_found' && (
            <p className="text-sm text-amber-700 mt-2">No license found. This may mean they are unlicensed, or records may be incomplete. Verify directly with your state board.</p>
          )}
        </Card>

        {/* Risk Flags */}
        {risk.risk_flags?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Risk Flags</h3>
            <div className="space-y-3">
              {risk.risk_flags.map((flag, i) => (
                <div key={i} className={cn(
                  'flex items-start gap-3 p-3 rounded-xl',
                  flag.severity === 'high' ? 'bg-red-50' : flag.severity === 'medium' ? 'bg-amber-50' : 'bg-slate-50'
                )}>
                  {flag.severity === 'high' ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /> :
                    flag.severity === 'medium' ? <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" /> :
                    <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{flag.flag}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{flag.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Disclaimer text={DISCLAIMERS.license_result} />
        <Disclaimer text={DISCLAIMERS.not_for_employment} variant="warning" />

        <Button variant="secondary" className="w-full" onClick={() => { setStep('form'); setResult(null); setAnswers({}); }}>
          Check another contractor
        </Button>
      </div>
    );
  }

  return null;
}
