'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import posthog from 'posthog-js';

export default function ShareButton({ shareUrl, variant = 'light' }: { shareUrl: string; variant?: 'light' | 'dark' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      posthog.capture('naili_share_created');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      posthog.capture('naili_share_created');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={variant === 'dark'
        ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/15'
        : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50'}
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Share your naili plan'}
    </button>
  );
}
