import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  selected?: boolean;
}

export default function Card({ className, hover, selected, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border p-6',
        hover && 'transition-shadow cursor-pointer hover:shadow-md',
        selected ? 'border-[#1f7cf7] ring-2 ring-[#d7f4ff] shadow-md' : 'border-slate-100 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
