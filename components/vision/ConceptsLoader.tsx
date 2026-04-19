'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ConceptsLoaderProps {
  projectId: string;
  category: string;
  style: string;
  qualityTier: string;
  notes?: string;
  referenceImageUrl?: string;
  hasImages: boolean;
  mode?: 'auto' | 'manual';
  buttonLabel?: string;
  className?: string;
}

export default function ConceptsLoader({
  projectId,
  category,
  style,
  qualityTier,
  notes,
  referenceImageUrl,
  hasImages,
  mode = 'auto',
  buttonLabel = 'Generate concept',
  className,
}: ConceptsLoaderProps) {
  const router = useRouter();
  const autoStartedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGeneration = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/vision/generate-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          category,
          style,
          quality_tier: qualityTier,
          notes: notes || undefined,
          reference_image_url: referenceImageUrl || undefined,
          count: 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate concepts');
      router.refresh();
    } catch (e) {
      console.error(e);
      setError(
        mode === 'manual'
          ? 'We could not refresh the concept just yet. Try again in a moment.'
          : 'Your concept is taking longer than expected. You can refresh later to try again.'
      );
      autoStartedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [category, loading, mode, notes, projectId, qualityTier, referenceImageUrl, router, style]);

  useEffect(() => {
    if (mode !== 'auto' || hasImages || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void runGeneration();
  }, [hasImages, mode, runGeneration]);

  if (mode === 'manual') {
    return (
      <div className={cn('space-y-2', className)}>
        <Button size="sm" variant="secondary" onClick={runGeneration} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {buttonLabel}
            </>
          )}
        </Button>
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-[rgba(216,185,138,0.28)] bg-canvas-50 px-3 py-2 text-sm text-ink">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sand" />
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  }

  if (hasImages) return null;

  return (
    <div className={cn('space-y-4 rounded-[1.75rem] border border-[rgba(216,185,138,0.22)] bg-[linear-gradient(135deg,rgba(251,248,244,0.96),rgba(246,243,238,0.94))] p-6 shadow-soft', className)}>
      <div className="flex items-start gap-3">
        {loading ? (
          <Loader2 className="mt-0.5 h-5 w-5 flex-shrink-0 animate-spin text-sand-dark" />
        ) : (
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-sand-dark" />
        )}
        <div>
          <p className="text-sm font-medium text-ink">Your planning results are ready.</p>
          <p className="mt-1 text-sm text-ink-600">
            We&apos;re generating a photo-grounded concept in the background so you don&apos;t have to wait on this page.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-[rgba(216,185,138,0.28)] bg-canvas-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sand-dark" />
          <p className="text-sm text-ink">{error}</p>
        </div>
      )}

      {!loading && (
        <div>
          <Button size="sm" onClick={runGeneration}>Generate concept</Button>
        </div>
      )}
    </div>
  );
}
