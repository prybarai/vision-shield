'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import posthog from 'posthog-js';

export default function ShareButton({ shareUrl }: { shareUrl: string }) {
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
      className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Share your naili plan'}
    </button>
  );
}
