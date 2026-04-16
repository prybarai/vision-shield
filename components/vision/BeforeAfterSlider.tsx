'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface Props {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: Props) {
  const [position, setPosition] = useState(56);
  const safePosition = Math.min(88, Math.max(12, position));

  return (
    <div className="rounded-[1.75rem] overflow-hidden border border-white/10 bg-[#111426] shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
      <div className="relative aspect-[4/3] bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beforeImage} alt={beforeLabel} className="absolute inset-0 h-full w-full object-cover" />

        <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${safePosition}%` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={afterImage} alt={afterLabel} className="h-full w-full object-cover" style={{ width: `${100 / (safePosition / 100)}%`, maxWidth: 'none' }} />
        </div>

        <div className="absolute inset-y-0" style={{ left: `calc(${safePosition}% - 1px)` }}>
          <div className="relative h-full w-[2px] bg-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
            <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/80 text-white backdrop-blur">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="absolute left-4 top-4 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {afterLabel}
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-900 backdrop-blur">
          {beforeLabel}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#151a31] px-5 py-4">
        <input
          type="range"
          min={12}
          max={88}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="w-full accent-[#e94560]"
          aria-label="Compare before and after images"
        />
      </div>
    </div>
  );
}
