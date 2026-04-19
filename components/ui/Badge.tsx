import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray';
}

export default function Badge({ className, variant = 'gray', children, ...props }: BadgeProps) {
  const variants = {
    green: 'border border-[rgba(184,216,200,0.55)] bg-[rgba(184,216,200,0.18)] text-ink',
    amber: 'border border-[rgba(216,185,138,0.45)] bg-[rgba(216,185,138,0.16)] text-ink',
    red: 'bg-red-100 text-red-800 border border-red-200',
    blue: 'border border-panel bg-canvas-50 text-ink-600',
    gray: 'border border-hairline bg-canvas-200 text-ink-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
