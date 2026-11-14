'use client';
import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Money } from '@/components/layout/Money';
import type { Invoice } from '@/lib/types';
import { INVOICE_STATUS_LABELS } from '@/lib/types';

export function InvoiceCard({ invoice, onEdit, onDelete }: { invoice: Invoice; onEdit?: () => void; onDelete?: () => void }) {
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

  return (
    <Card className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/invoices/${invoice.reference}`} className="block truncate text-base font-semibold text-slate-900 hover:text-brand-600">
            {invoice.reference}
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-400">{invoice.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={invoice.status === 'paid' ? 'won' : invoice.status === 'overdue' ? 'lost' : 'quoted'}>
            {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
          </Badge>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Actions" className="flex h-10 w-10 items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100">
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {onEdit && <button onClick={() => { setMenuOpen(false); onEdit(); }} className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Edit</button>}
                {onDelete && <button onClick={() => { setMenuOpen(false); onDelete(); }} className="block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">Delete</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">{invoice.currency}</span>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700">Due {invoice.dueDate}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="text-base font-bold text-slate-900">
          <Money value={invoice.totalAmount} />
        </div>
        <div className="text-xs text-slate-500">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</div>
      </div>
    </Card>
  );
}