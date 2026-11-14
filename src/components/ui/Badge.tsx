import * as React from 'react';
import { cn } from '@/lib/cn';

const colors: Record<string, string> = {
  new: 'bg-sky-100 text-sky-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-violet-100 text-violet-700',
  quoted: 'bg-brand-100 text-brand-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-rose-100 text-rose-700',
  archived: 'bg-slate-100 text-slate-600',
  hot: 'bg-rose-50 text-rose-600',
  warm: 'bg-amber-50 text-amber-700',
  cold: 'bg-sky-50 text-sky-600',
};

export function Badge({ className, children, tone }: { className?: string; children: React.ReactNode; tone?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', tone ? colors[tone] ?? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600', className)}>
      {children}
    </span>
  );
}