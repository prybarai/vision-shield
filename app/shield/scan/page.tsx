'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, CheckCircle, FileText, HelpCircle, ShieldCheck, Upload, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Disclaimer from '@/components/ui/Disclaimer';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { getRiskBgColor, getRiskLabel, cn } from '@/lib/utils';
import Link from 'next/link';
import posthog from 'posthog-js';

interface QuoteAnalysis {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  red_flags: Array<{ flag: string; explanation: string; severity: 'high' | 'medium' | 'low' }>;
  missing_terms: Array<{ term: string; why_important: string }>;
  questions_to_ask: string[];
  plain_english_summary: string;
  payment_structure_analysis: string;
}

export default function ShieldScanPage() {
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteAnalysis | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;

      if (file.type === 'application/pdf') {
        setError('PDF upload is still limited. For the sharpest result, paste the important contract or quote text directly.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setText((e.target?.result as string) || '');
        setError(null);
      };
      reader.readAsText(file);
    },
  });

  const handleScan = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError('Please provide quote or contract text to analyze.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/shield/scan-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text, session_id: uuidv4() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      const analysis = data.analysis || data.scan;
      posthog.capture('shield_quote_scanned', {
        risk_level: analysis?.risk_level,
        input_mode: mode,
      });
      setResult(analysis);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Failed to analyze document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setText(''); setError(null); };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Shield quote review</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Quote analysis</h1>
          </div>
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700">Scan another</button>
        </div>

        <Card className={cn('border p-5 sm:p-6', getRiskBgColor(result.risk_level))}>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Overall risk</h2>
              <p className="text-sm text-slate-600 mt-1">A plain-English read on how safe or sloppy this quote appears.</p>
            </div>
            <Badge variant={result.risk_level === 'low' ? 'green' : result.risk_level === 'medium' ? 'amber' : 'red'}>
              {getRiskLabel(result.risk_level)} · {result.risk_score}/100
            </Badge>
          </div>
          <p className="text-slate-800 leading-relaxed">{result.plain_english_summary}</p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            {result.risk_level === 'low'
              ? 'Nothing major jumps out from this text alone, but you should still confirm scope, payment timing, warranty coverage, and change-order terms.'
              : result.risk_level === 'medium'
              ? 'There are enough rough edges here that I would tighten the paperwork before moving forward.'
              : 'This quote shows serious risk signals. I would pause, ask for revisions, or compare it against a cleaner quote before paying more money.'}
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-2">Payment structure</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{result.payment_structure_analysis}</p>
        </Card>

        {result.red_flags?.length > 0 && (
          <Card className="p-5 sm:p-6">
            <h2 className="font-bold text-slate-900 mb-3">Red flags</h2>
            <div className="space-y-3">
              {result.red_flags.map((flag, i) => (
                <div key={i} className={cn('flex items-start gap-3 p-4 rounded-2xl', flag.severity === 'high' ? 'bg-red-50' : flag.severity === 'medium' ? 'bg-amber-50' : 'bg-slate-50')}>
                  {flag.severity === 'high' ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /> : flag.severity === 'medium' ? <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" /> : <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{flag.flag}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{flag.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {result.missing_terms?.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-bold text-slate-900 mb-3">Missing or weak terms</h2>
              <div className="space-y-3">
                {result.missing_terms.map((term, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{term.term}</div>
                      <div className="text-xs text-slate-600 mt-1 leading-relaxed">{term.why_important}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.questions_to_ask?.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="font-bold text-slate-900 mb-3">Questions to ask before signing</h2>
              <ul className="space-y-3">
                {result.questions_to_ask.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-[#1f7cf7] font-bold flex-shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <Card className="bg-slate-900 text-white p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#d7f4ff] mb-2">
            <ShieldCheck className="h-4 w-4" />
            Recommended next step
          </div>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">If this quote still feels off, verify the contractor or compare it against a cleaner contractor path instead of guessing.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shield/check" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
              Run contractor check
            </Link>
            <Link href="/connect" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              Find vetted contractor
            </Link>
          </div>
        </Card>

        <Disclaimer text={DISCLAIMERS.ai_contract_scan} variant="warning" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-5 sm:p-7 shadow-sm mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Scan a quote or contract</h1>
        <p className="text-slate-600 leading-relaxed">
          Paste the quote or contract text for the most reliable result. File upload works best for plain text only, and pasted text usually gives the sharpest review.
        </p>
      </div>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('paste')} className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors', mode === 'paste' ? 'bg-[#1f7cf7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            Paste text
          </button>
          <button onClick={() => setMode('upload')} className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors', mode === 'upload' ? 'bg-[#1f7cf7] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            Upload file
          </button>
        </div>

        {mode === 'paste' ? (
          <textarea
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#48c7f1] resize-none font-mono text-sm"
            rows={14}
            placeholder="Paste the important parts of your quote or contract here, including payment schedule, scope, warranty language, change orders, and cancellation terms..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
        ) : (
          <div>
            <div {...getRootProps()} className={cn('border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors', isDragActive ? 'border-[#1f7cf7] bg-[#eef8ff]' : 'border-slate-300 hover:border-[#48c7f1]')}>
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">Drag and drop or click to upload</p>
              <p className="text-sm text-slate-500 mt-1">TXT works now. For PDFs, paste the key sections instead.</p>
            </div>
            {text && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">File loaded ({text.length} characters)</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm mb-4">{error}</div>}
      <Disclaimer text={DISCLAIMERS.ai_contract_scan} variant="warning" className="mb-4" />

      <Button className="w-full" size="lg" onClick={handleScan} loading={loading} disabled={!text.trim()}>
        Analyze document
      </Button>
    </div>
  );
}
