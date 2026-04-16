'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ConceptsLoaderProps {
  projectId: string;
  category: string;
  style: string;
  qualityTier: string;
  notes?: string;
  referenceImageUrl?: string;
  hasImages: boolean;
}

export default function ConceptsLoader({
  projectId,
  category,
  style,
  qualityTier,
  notes,
  referenceImageUrl,
  hasImages,
}: ConceptsLoaderProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(hasImages);
  const [error, setError] = useState<string | null>(null);

  const runGeneration = useCallback(async () => {
    if (startedRef.current || done) return;
    startedRef.current = true;
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
          count: 3,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate concepts');
      setDone(true);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError('Design concepts are taking longer than expected. You can refresh later to try again.');
      startedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [category, done, notes, projectId, qualityTier, referenceImageUrl, router, style]);

  useEffect(() => {
    if (!hasImages) runGeneration();
  }, [hasImages, runGeneration]);

  if (hasImages) return null;

  return (
    <div className="bg-[#eef8ff] border border-[#bdefff] rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        {loading ? (
          <Loader2 className="h-5 w-5 text-[#1f7cf7] flex-shrink-0 mt-0.5 animate-spin" />
        ) : (
          <Sparkles className="h-5 w-5 text-[#1f7cf7] flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-[#0d2340] text-sm font-medium">Your planning results are ready.</p>
          <p className="text-[#123964] text-sm mt-1">
            We&apos;re generating three design concepts in the background so you don&apos;t have to wait on this page.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-white/70 border border-[#d7f4ff] rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-[#0f5fc6] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#0d2340]">{error}</p>
        </div>
      )}

      {!loading && !done && (
        <div>
          <Button size="sm" onClick={runGeneration}>Generate concepts</Button>
        </div>
      )}
    </div>
  );
}
