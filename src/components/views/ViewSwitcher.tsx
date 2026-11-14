'use client';
import * as React from 'react';
import { cn } from '@/lib/cn';

export type ViewType = 'card' | 'list' | 'board' | 'calendar' | 'timeline' | 'gantt' | 'map' | 'table';

const VIEW_CONFIG: Record<ViewType, { label: string; icon: string }> = {
  card: { label: 'Cards', icon: '🃏' },
  list: { label: 'List', icon: '☰' },
  board: { label: 'Board', icon: '📋' },
  calendar: { label: 'Calendar', icon: '📅' },
  timeline: { label: 'Timeline', icon: '⏱' },
  gantt: { label: 'Gantt', icon: '📊' },
  map: { label: 'Map', icon: '🗺' },
  table: { label: 'Table', icon: '⊞' },
};

export function ViewSwitcher({ 
  views, 
  current, 
  onChange 
}: { 
  views: ViewType[]; 
  current: ViewType; 
  onChange: (view: ViewType) => void;
}) {
  return (
    <div className="flex rounded-md border border-slate-200 bg-white p-1">
      {views.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors',
            current === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          )}
          title={VIEW_CONFIG[v].label}
        >
          <span>{VIEW_CONFIG[v].icon}</span>
          <span className="hidden sm:inline">{VIEW_CONFIG[v].label}</span>
        </button>
      ))}
    </div>
  );
}

export { VIEW_CONFIG };