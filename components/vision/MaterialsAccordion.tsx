'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Package2 } from 'lucide-react';
import { formatCurrencyRange } from '@/lib/utils';
import type { MaterialList, MaterialLineItem } from '@/types';

interface Props {
  materials: MaterialList;
}

function buildRetailerSearchUrl(item: string) {
  return `https://www.homedepot.com/s/${encodeURIComponent(item)}`;
}

export default function MaterialsAccordion({ materials }: Props) {
  const grouped = useMemo(() => materials.line_items.reduce<Record<string, MaterialLineItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {}), [materials.line_items]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.keys(grouped).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, items]) => {
        const groupLow = items.reduce((sum, item) => sum + item.estimated_cost_low, 0);
        const groupHigh = items.reduce((sum, item) => sum + item.estimated_cost_high, 0);

        return (
          <div key={category} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <button
              onClick={() => toggle(category)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-slate-50 sm:px-6"
            >
              <div>
                <div className="text-lg font-semibold text-slate-900">{category}</div>
                <div className="mt-1 text-sm text-slate-500">{items.length} item{items.length !== 1 ? 's' : ''} • {formatCurrencyRange(groupLow, groupHigh)}</div>
              </div>
              {openSections[category] ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>

            {openSections[category] && (
              <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 lg:grid-cols-2">
                {items.map((item, index) => (
                  <div key={`${item.item}-${index}`} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{item.item}</div>
                        <div className="mt-1 text-sm text-slate-500">{item.quantity} {item.unit} • {item.finish_tier} tier</div>
                      </div>
                      <div className="rounded-full bg-[#f4fde8] px-3 py-1 text-xs font-semibold text-[#8b5b00]">
                        {formatCurrencyRange(item.estimated_cost_low, item.estimated_cost_high)}
                      </div>
                    </div>

                    {item.sourcing_notes && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.sourcing_notes}</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        <Package2 className="h-3.5 w-3.5" /> Allowance-ready
                      </span>
                      <a
                        href={buildRetailerSearchUrl(item.item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Search supplier <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {materials.sourcing_notes && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <span className="font-semibold text-slate-900">Sourcing note:</span> {materials.sourcing_notes}
        </div>
      )}
    </div>
  );
}
