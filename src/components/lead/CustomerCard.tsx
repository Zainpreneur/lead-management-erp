'use client';
import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/layout/Money';
import type { Customer } from '@/lib/types';
import { CUSTOMER_STATUS_LABELS } from '@/lib/types';

export function CustomerCard({ customer, onEdit, onDelete }: { customer: Customer; onEdit?: () => void; onDelete?: () => void }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const location = [customer.city, customer.country].filter(Boolean).join(', ');
  return (
    <Card className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/customers/${customer.reference}`} className="block truncate text-base font-semibold text-slate-900 hover:text-brand-600">
            {customer.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {customer.reference}{location ? ` • ${location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={customer.status === 'active' ? 'won' : customer.status === 'paused' ? 'contacted' : 'archived'}>
            {CUSTOMER_STATUS_LABELS[customer.status] ?? customer.status}
          </Badge>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Actions"
              className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-10 w-32 rounded-md border border-slate-200 bg-white py-1 shadow-md">
                {onEdit && (
                  <button onClick={() => { setMenuOpen(false); onEdit(); }} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                )}
                {onDelete && (
                  <button onClick={() => { setMenuOpen(false); onDelete(); }} className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Delete</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {customer.category && (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">{customer.category}</span>
        )}
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700">MRR ${customer.mrr.toLocaleString()}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="text-base font-bold text-slate-900">
          <Money value={customer.totalValue} />
        </div>
        {customer.assignedToName && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{customer.assignedToName}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
              {customer.assignedToName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}