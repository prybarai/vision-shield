'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Upload, AlertTriangle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Disclaimer from '@/components/ui/Disclaimer';
import { DISCLAIMERS } from '@/lib/disclaimers';
import { getRiskBgColor, getRiskLabel, cn } from '@/lib/utils';
import Link from 'next/link';

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
        setError('PDF upload is not fully supported yet. For now, paste the important quote or contract text directly.');
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
      setResult(data.analysis || data.scan);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Failed to analyze document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setText(''); setError(null); };

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Shield quote review</p>
            <h1 className="text-2xl font-bold text-slate-900">Quote analysis</h1>
          </div>
          <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700">Scan another</button>
        </div>

        <Card className={cn('border', getRiskBgColor(result.risk_level))}>
          <div className="flex items-center justify-between mb-2 gap-3">
            <h3 className="font-bold text-slate-900">Overall risk</h3>
            <Badge variant={result.risk_level === 'low' ? 'green' : result.risk_level === 'medium' ? 'amber' : 'red'}>
              {getRiskLabel(result.risk_level)} · {result.risk_score}/100
            </Badge>
          </div>
          <p className="text-slate-700 leading-relaxed">{result.plain_english_summary}</p>
          <p className="text-sm text-slate-600 mt-3">
            {result.risk_level === 'low'
              ? 'No obvious major traps surfaced from this text, but confirm the scope, payment schedule, warranty, and change-order terms before signing.'
              : result.risk_level === 'medium'
              ? 'This quote has enough rough edges that I would tighten the paperwork before moving forward.'
              : 'This quote shows serious risk signals. I would pause and get another quote or a cleaner contract before paying more money.'}
          </p>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-900 mb-2">Payment structure analysis</h3>
          <p className="text-slate-700 text-sm leading-relaxed">{result.payment_structure_analysis}</p>
        </Card>

        {result.red_flags?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Red flags</h3>
            <div className="space-y-3">
              {result.red_flags.map((flag, i) => (
                <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl', flag.severity === 'high' ? 'bg-red-50' : flag.severity === 'medium' ? 'bg-amber-50' : 'bg-slate-50')}>
                  {flag.severity === 'high' ? <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" /> : flag.severity === 'medium' ? <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" /> : <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{flag.flag}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{flag.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {result.missing_terms?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Missing terms</h3>
            <div className="space-y-2">
              {result.missing_terms.map((term, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <XCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{term.term}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{term.why_important}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {result.questions_to_ask?.length > 0 && (
          <Card>
            <h3 className="font-bold text-slate-900 mb-3">Questions to ask</h3>
            <ul className="space-y-2">
              {result.questions_to_ask.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>{q}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="bg-slate-900 text-white">
          <h3 className="font-bold text-lg mb-2">Recommended next step</h3>
          <p className="text-sm text-slate-300 mb-4">If this quote still feels off, compare it against a vetted contractor path instead of guessing.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/shield" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
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
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Scan a quote or contract</h1>
        <p className="text-slate-500">Paste the quote or contract text for the most reliable result. File upload is best-effort for plain text only, and pasted text usually gives a sharper review.</p>
      </div>

      <Card className="mb-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('paste')} className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', mode === 'paste' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            Paste text
          </button>
          <button onClick={() => setMode('upload')} className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-colors', mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
            Upload file
          </button>
        </div>

        {mode === 'paste' ? (
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
            rows={12}
            placeholder="Paste your quote or contract text here..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
        ) : (
          <div>
            <div {...getRootProps()} className={cn('border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors', isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400')}>
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Drag & drop or click to upload</p>
              <p className="text-sm text-slate-400 mt-1">TXT supported now. PDFs: paste key sections instead.</p>
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

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">{error}</div>}
      <Disclaimer text={DISCLAIMERS.ai_contract_scan} variant="warning" className="mb-4" />

      <Button className="w-full" size="lg" onClick={handleScan} loading={loading} disabled={!text.trim()}>
        Analyze document
      </Button>
    </div>
  );
}
