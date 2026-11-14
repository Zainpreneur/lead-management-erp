'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  date: string;
  type?: 'created' | 'updated' | 'completed' | 'comment' | 'status_change';
  actor?: string;
}

const typeColors: Record<string, string> = {
  created: 'bg-emerald-500',
  updated: 'bg-brand-500',
  completed: 'bg-emerald-600',
  comment: 'bg-slate-400',
  status_change: 'bg-amber-500',
};

export function TimelineView({ items }: { items: TimelineItem[] }) {
  const sorted = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-4">
        {sorted.map((item, idx) => (
          <div key={item.id} className="relative flex gap-4 pl-10">
            <div className={cn('absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-white', typeColors[item.type || 'created'])} />
            <div className="flex-1 rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{item.title}</span>
                <span className="text-xs text-slate-400">{new Date(item.date).toLocaleString()}</span>
              </div>
              {item.description && <p className="mt-1 text-xs text-slate-600">{item.description}</p>}
              {item.actor && <div className="mt-1 text-xs text-slate-400">by {item.actor}</div>}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="py-8 text-center text-sm text-slate-400">No timeline items.</div>}
      </div>
    </div>
  );
}