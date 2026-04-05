'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrencyRange } from '@/lib/utils';
import type { MaterialList, MaterialLineItem } from '@/types';

interface Props {
  materials: MaterialList;
}

export default function MaterialsAccordion({ materials }: Props) {
  const grouped = materials.line_items.reduce<Record<string, MaterialLineItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.keys(grouped).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const toggle = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {Object.entries(grouped).map(([cat, items], catIdx) => (
        <div key={cat} className={catIdx > 0 ? 'border-t border-slate-100' : ''}>
          <button
            onClick={() => toggle(cat)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">{cat}</span>
              <span className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            {openSections[cat] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections[cat] && (
            <div className="border-t border-slate-50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-5 py-2 text-xs font-semibold text-slate-500">Item</th>
                      <th className="px-3 py-2 text-xs font-semibold text-slate-500">Qty</th>
                      <th className="px-3 py-2 text-xs font-semibold text-slate-500">Unit</th>
                      <th className="px-3 py-2 text-xs font-semibold text-slate-500">Tier</th>
                      <th className="px-3 py-2 text-xs font-semibold text-slate-500">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="border-t border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">{item.item}</div>
                          {item.sourcing_notes && <div className="text-xs text-slate-400 mt-0.5">{item.sourcing_notes}</div>}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{item.quantity}</td>
                        <td className="px-3 py-3 text-slate-600">{item.unit}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{item.finish_tier}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 font-medium whitespace-nowrap">
                          {formatCurrencyRange(item.estimated_cost_low, item.estimated_cost_high)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {materials.sourcing_notes && (
        <div className="border-t border-slate-100 p-5 bg-slate-50">
          <p className="text-sm text-slate-600"><span className="font-semibold">Sourcing note:</span> {materials.sourcing_notes}</p>
        </div>
      )}
    </div>
  );
}
