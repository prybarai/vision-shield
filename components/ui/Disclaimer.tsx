import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface DisclaimerProps {
  text: string;
  className?: string;
  variant?: 'info' | 'warning';
}

export default function Disclaimer({ text, className, variant = 'info' }: DisclaimerProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-4 text-sm',
        variant === 'info' ? 'border-[#d7f4ff] bg-[#eef8ff] text-[#123964]' : 'bg-amber-50 border-amber-200 text-amber-800',
        className
      )}
    >
      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
