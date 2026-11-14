'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface MapItem {
  id: string | number;
  title: string;
  location: string;
  count?: number;
  color?: string;
}

export function MapView({ items }: { items: MapItem[] }) {
  // Group items by location
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.location]) acc[item.location] = [];
    acc[item.location].push(item);
    return acc;
  }, {} as Record<string, MapItem[]>);
  
  const locations = Object.keys(grouped).sort();
  const maxCount = Math.max(...locations.map((l) => grouped[l].length), 1);
  
  if (locations.length === 0) return <div className="py-8 text-center text-sm text-slate-400">No location data.</div>;
  
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 mb-2">Geographic distribution ({items.length} total)</div>
      {locations.map((loc) => (
        <div key={loc} className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-slate-900">{loc}</span>
            <span className="text-xs text-slate-500">{grouped[loc].length} item{grouped[loc].length !== 1 ? 's' : ''}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-brand-500" style={{ width: `${(grouped[loc].length / maxCount) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {grouped[loc].slice(0, 5).map((item) => (
              <span key={item.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{item.title}</span>
            ))}
            {grouped[loc].length > 5 && <span className="text-[10px] text-slate-400">+{grouped[loc].length - 5} more</span>}
          </div>
        </div>
      ))}
    </div>
  );
}