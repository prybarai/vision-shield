'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface Props {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  priority?: boolean;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  priority = false,
}: Props) {
  const [position, setPosition] = useState(56);
  const safePosition = Math.min(88, Math.max(12, position));

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] bg-slate-100">
        <Image src={beforeImage} alt={beforeLabel} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority={priority} />

        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${safePosition}%` }}>
          <div className="relative h-full" style={{ width: `${100 / (safePosition / 100)}%`, maxWidth: 'none' }}>
            <Image src={afterImage} alt={afterLabel} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority={priority} />
          </div>
        </div>

        <div className="absolute inset-y-0" style={{ left: `calc(${safePosition}% - 1px)` }}>
          <div className="relative h-full w-[2px] bg-white/95 shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
            <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
          {afterLabel}
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
          {beforeLabel}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <input
          type="range"
          min={12}
          max={88}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="w-full accent-[#1f7cf7]"
          aria-label="Compare before and after images"
        />
      </div>
    </div>
  );
}
