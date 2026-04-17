'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, ChevronRight, Loader2, Mic, PauseCircle, PlayCircle, Ruler, Sparkles, Waves } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { WalkthroughNode, WalkthroughState, WalkthroughSummaryItem } from '@/lib/walkthrough/types';

type WalkthroughSnapshot = {
  sessionId: string;
  script: {
    id: string;
    trade: string;
    version: string;
    label: string;
    intro: string;
    completionNodeId: string;
    startNodeId: string;
    nodeCount: number;
  };
  state: WalkthroughState;
  currentNode: WalkthroughNode;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  confirmSummary: WalkthroughSummaryItem[];
};

const STORAGE_KEY = 'naili.walkthrough.interior_paint.session';

function inputIcon(node: WalkthroughNode) {
  switch (node.type) {
    case 'observe':
      return <Camera className="h-4 w-4" />;
    case 'measure':
      return <Ruler className="h-4 w-4" />;
    case 'demonstrate':
      return <Waves className="h-4 w-4" />;
    default:
      return <Mic className="h-4 w-4" />;
  }
}

export default function EstimatorWalkthrough() {
  const [snapshot, setSnapshot] = useState<WalkthroughSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [numericValue, setNumericValue] = useState('');
  const [captureSummary, setCaptureSummary] = useState('');

  const loadOrCreateSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedSessionId = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

      if (savedSessionId) {
        const existingRes = await fetch(`/api/walkthrough/session?sessionId=${savedSessionId}`);
        if (existingRes.ok) {
          const existing = await existingRes.json() as WalkthroughSnapshot;
          setSnapshot(existing);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/walkthrough/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade: 'interior_paint' }),
      });

      if (!res.ok) throw new Error('Failed to start walkthrough');
      const created = await res.json() as WalkthroughSnapshot;
      window.localStorage.setItem(STORAGE_KEY, created.sessionId);
      setSnapshot(created);
    } catch (err) {
      console.error(err);
      setError('Could not start the estimator walkthrough just now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrCreateSession();
  }, [loadOrCreateSession]);

  useEffect(() => {
    setTextValue('');
    setNumericValue('');
    setCaptureSummary('');
  }, [snapshot?.currentNode.id]);

  const sendAdvance = useCallback(async (payload: Record<string, unknown> = {}) => {
    if (!snapshot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/walkthrough/session/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: snapshot.sessionId,
          input: payload,
        }),
      });

      if (!res.ok) throw new Error('Failed to advance walkthrough');
      const next = await res.json() as WalkthroughSnapshot;
      setSnapshot(next);
      window.localStorage.setItem(STORAGE_KEY, next.sessionId);
    } catch (err) {
      console.error(err);
      setError('That step did not save cleanly. Please try once more.');
    } finally {
      setSubmitting(false);
    }
  }, [snapshot]);

  const updateStatus = useCallback(async (action: 'pause' | 'resume') => {
    if (!snapshot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/walkthrough/session/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: snapshot.sessionId, action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} walkthrough`);
      const next = await res.json() as WalkthroughSnapshot;
      setSnapshot(next);
    } catch (err) {
      console.error(err);
      setError(`Could not ${action} this walkthrough just now.`);
    } finally {
      setSubmitting(false);
    }
  }, [snapshot]);

  const choiceOptions = useMemo(() => {
    if (!snapshot || snapshot.currentNode.type !== 'ask') return [];
    if (snapshot.currentNode.responseType === 'boolean' && !snapshot.currentNode.choices) {
      return [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ];
    }
    return snapshot.currentNode.choices || [];
  }, [snapshot]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#1f7cf7]" />
          Loading the estimator walkthrough...
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
        {error || 'The walkthrough could not be loaded.'}
      </div>
    );
  }

  const { currentNode, progress, state } = snapshot;
  const isComplete = state.status === 'completed';
  const isPaused = state.status === 'paused';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="bg-[linear-gradient(135deg,#0d2340_0%,#123964_40%,#165ca8_72%,#48c7f1_100%)] px-5 py-6 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                <Sparkles className="h-3.5 w-3.5 text-[#a8eb57]" />
                proof phase • interior painting
              </div>
              <h1 className="mt-4 text-3xl font-bold">Virtual estimator walkthrough</h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
                A node-driven beta shell for the new naili estimator. This is the foundation for the voice, camera, AR, and contractor-grade scope flow in your rebuild spec.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right text-sm backdrop-blur">
              <div className="font-semibold">{progress.percent}% complete</div>
              <div className="text-white/70">{progress.completed} of {progress.total} steps</div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#1f7cf7_0%,#48c7f1_65%,#a8eb57_100%)]" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
              {inputIcon(currentNode)}
              {currentNode.type}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#eef8ff] px-3 py-1.5 font-medium text-[#123964]">
              {snapshot.script.version}
            </div>
            {isPaused && (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f4fde8] px-3 py-1.5 font-medium text-[#4f8a24]">
                paused and resumable
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {isComplete ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Walkthrough complete</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  The estimator shell has captured a resumable inspection state and a contractor-style summary. Next, this needs the real voice, camera, AR, and pricing integrations wired into the same node contract.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Inspection summary</h3>
                <div className="mt-4 space-y-3">
                  {snapshot.confirmSummary.map((item) => (
                    <div key={item.key} className="flex flex-col gap-1 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                      <div className="text-sm text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={loadOrCreateSession}>Start a new walkthrough</Button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1f7cf7]">Current step</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{currentNode.title}</h2>
                <p className="mt-3 text-base leading-relaxed text-slate-700">{currentNode.prompt}</p>
                {currentNode.helpText && <p className="mt-2 text-sm text-slate-500">{currentNode.helpText}</p>}
              </div>

              {currentNode.type === 'ask' && choiceOptions.length > 0 && (
                <div className="grid gap-3">
                  {choiceOptions.map((choice) => (
                    <button
                      key={String(choice.value)}
                      type="button"
                      className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-left transition-colors hover:border-[#48c7f1] hover:bg-[#eef8ff]"
                      onClick={() => sendAdvance({ value: choice.value })}
                      disabled={submitting}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{choice.label}</div>
                        {choice.description && <div className="mt-1 text-sm text-slate-500">{choice.description}</div>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}

              {currentNode.type === 'ask' && choiceOptions.length === 0 && (
                <div className="space-y-3">
                  <textarea
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    className="min-h-[120px] w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-[#48c7f1] focus:ring-2 focus:ring-[#d7f4ff]"
                    placeholder="Answer in plain language..."
                  />
                  <Button onClick={() => sendAdvance({ value: textValue })} disabled={submitting || !textValue.trim()}>
                    Save answer
                  </Button>
                </div>
              )}

              {currentNode.type === 'measure' && (
                <div className="space-y-3">
                  <input
                    value={numericValue}
                    onChange={(event) => setNumericValue(event.target.value)}
                    type="number"
                    step="0.1"
                    className="w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-[#48c7f1] focus:ring-2 focus:ring-[#d7f4ff]"
                    placeholder={`Enter ${currentNode.unit.replace('_', ' ')}`}
                  />
                  <Button onClick={() => sendAdvance({ measurementValue: Number(numericValue) })} disabled={submitting || !numericValue}>
                    Save measurement
                  </Button>
                </div>
              )}

              {(currentNode.type === 'observe' || currentNode.type === 'demonstrate') && (
                <div className="space-y-3">
                  <textarea
                    value={captureSummary}
                    onChange={(event) => setCaptureSummary(event.target.value)}
                    className="min-h-[120px] w-full rounded-[1.25rem] border border-slate-200 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-[#48c7f1] focus:ring-2 focus:ring-[#d7f4ff]"
                    placeholder="For now, describe what was captured or observed. This is where live camera/audio integration will feed the node contract."
                  />
                  <Button onClick={() => sendAdvance({ summary: captureSummary || 'Capture completed' })} disabled={submitting}>
                    Mark capture complete
                  </Button>
                </div>
              )}

              {currentNode.type === 'confirm' && (
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="space-y-3">
                      {snapshot.confirmSummary.map((item) => (
                        <div key={item.key} className="border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                          <div className="mt-1 text-sm text-slate-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => sendAdvance()} disabled={submitting}>Confirm and finish</Button>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                {isPaused ? (
                  <Button variant="secondary" onClick={() => updateStatus('resume')} disabled={submitting}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Resume walkthrough
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => updateStatus('pause')} disabled={submitting}>
                    <PauseCircle className="mr-2 h-4 w-4" /> Pause and resume later
                  </Button>
                )}
                <Button variant="ghost" onClick={loadOrCreateSession} disabled={submitting}>Start over</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
