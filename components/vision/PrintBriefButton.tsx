'use client';

import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label?: string;
  className?: string;
}

export default function PrintBriefButton({ label = 'Print brief', className }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors',
        className,
      )}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
