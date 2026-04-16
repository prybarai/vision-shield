import { useId } from 'react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  taglineClassName?: string;
  markOnly?: boolean;
};

export default function Logo({
  className,
  markClassName,
  wordmarkClassName,
  theme = 'light',
  showTagline = false,
  taglineClassName,
  markOnly = false,
}: LogoProps) {
  const gradientId = useId().replace(/:/g, '');
  const primaryText = theme === 'dark' ? 'text-white' : 'text-slate-950';
  const secondaryText = theme === 'dark' ? 'text-slate-300' : 'text-slate-400';
  const taglineText = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        viewBox="0 0 100 88"
        aria-hidden="true"
        className={cn(markOnly ? 'h-9 w-10' : 'h-10 w-11', markClassName)}
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="12" y1="78" x2="88" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f7cf7" />
            <stop offset="0.55" stopColor="#48c7f1" />
            <stop offset="1" stopColor="#a8eb57" />
          </linearGradient>
        </defs>
        <path
          d="M18 78V33.5L50 10L82 33.5V70"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34 78V48L66 71"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {!markOnly && (
        <div className="min-w-0">
          <div className={cn('text-2xl font-bold tracking-tight leading-none', primaryText, wordmarkClassName)}>
            <span>naili</span>
            <span className={cn('ml-0.5', secondaryText)}>.ai</span>
          </div>
          {showTagline && (
            <div className={cn('text-xs leading-none mt-1', taglineText, taglineClassName)}>
              Nail the vision. Know the cost.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
