'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export interface GanttItem {
  id: string | number;
  title: string;
  startDate: string;
  endDate: string;
  progress?: number;
  color?: string;
  assignee?: string;
}

export function GanttView({ items }: { items: GanttItem[] }) {
  if (items.length === 0) return <div className="py-8 text-center text-sm text-slate-400">No items.</div>;
  
  const allDates = items.flatMap((i) => [new Date(i.startDate), new Date(i.endDate)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const dayWidth = 30;
  const totalWidth = totalDays * dayWidth;
  
  const getOffset = (date: string) => {
    const d = new Date(date);
    return Math.ceil((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * dayWidth;
  };
  
  const getWidth = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24) + 1) * dayWidth;
  };
  
  // Generate day headers
  const days: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(minDate.getTime() + i * 1000 * 60 * 60 * 24);
    days.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <div style={{ minWidth: totalWidth + 200 }}>
        {/* Header */}
        <div className="flex border-b border-slate-200">
          <div className="w-48 shrink-0 border-r border-slate-200 px-3 py-2 text-xs font-medium text-slate-500">Task</div>
          <div className="flex">
            {days.map((d, i) => (
              <div key={i} className="flex shrink-0 items-center justify-center border-r border-slate-100 px-1 py-2 text-[10px] text-slate-400" style={{ width: dayWidth }}>
                {d}
              </div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {items.map((item) => (
          <div key={item.id} className="flex border-b border-slate-100 hover:bg-slate-50">
            <div className="w-48 shrink-0 border-r border-slate-200 px-3 py-2">
              <div className="truncate text-xs font-medium text-slate-900">{item.title}</div>
              {item.assignee && <div className="truncate text-[10px] text-slate-400">{item.assignee}</div>}
            </div>
            <div className="relative" style={{ width: totalWidth, height: 36 }}>
              <div
                className={cn('absolute top-1.5 h-6 rounded', item.color || 'bg-brand-500')}
                style={{ left: getOffset(item.startDate), width: getWidth(item.startDate, item.endDate) }}
              >
                {item.progress !== undefined && (
                  <div className="h-full rounded bg-white/30" style={{ width: `${100 - item.progress}%`, marginLeft: 'auto' }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}