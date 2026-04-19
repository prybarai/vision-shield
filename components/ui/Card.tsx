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
        'rounded-[1.75rem] border border-hairline bg-canvas-50 p-6 shadow-soft',
        hover && 'cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift',
        selected
          ? 'border-[rgba(216,185,138,0.45)] bg-[#fffaf4] ring-2 ring-[rgba(216,185,138,0.16)] shadow-lift'
          : 'border-hairline',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
