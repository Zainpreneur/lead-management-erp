'use client';
export const dynamic = 'force-dynamic';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { InvoiceCard } from '@/components/lead/InvoiceCard';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Invoice } from '@/lib/types';
import { INVOICE_STATUS_LABELS } from '@/lib/types';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';

export default function InvoicesPage() {
  const router = useRouter();
  const toast = useToast();
  const [searchInput, setSearchInput] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<Invoice | null>(null);
  const [view, setView] = React.useState<'card' | 'list' | 'calendar' | 'timeline'>('card');
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listInvoices({ search: searchInput || undefined, status: status || undefined, limit: pageSize, page });
      setInvoices(res.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchInput, status, page]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteInvoice(deleting.reference);
      setDeleting(null);
      toast.add({ variant: 'success', title: 'Invoice deleted' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete invoice', description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Invoices</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{invoices.length}</span>
          </div>
          <Button size="sm" onClick={() => router.push('/invoices/create')}>+ New</Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search invoices..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-0 flex-1"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32 shrink-0">
          <option value="">All statuses</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
        <div className="mb-4">
          <ViewSwitcher
            views={['card', 'list', 'calendar', 'timeline']}
            current={view}
            onChange={(v) => setView(v as 'card' | 'list' | 'calendar' | 'timeline')}
          />
        </div>

        {view === 'card' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {invoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} onDelete={() => setDeleting(inv)} />
            ))}
            {invoices.length === 0 && (
              <div className="col-span-full rounded-md border border-dashed border-slate-300 bg-white py-12 text-center">
                <div className="text-lg font-medium text-slate-700">No invoices found</div>
                <p className="mt-1 text-sm text-slate-500">Create an invoice to get started.</p>
                <div className="mt-4">
                  <Button onClick={() => router.push('/invoices/create')}>+ New Invoice</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'list' && (
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{inv.reference}</td>
                    <td className="px-4 py-2 text-slate-600">{inv.customerName}</td>
                    <td className="px-4 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{inv.status}</span></td>
                    <td className="px-4 py-2 font-medium">${inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500">{inv.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'calendar' && (
          <CalendarView
            events={invoices.map((inv) => ({
              id: inv.id,
              title: inv.reference,
              date: inv.dueDate,
              color: inv.status === 'paid' ? 'bg-emerald-500' : inv.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500',
            }))}
          />
        )}

        {view === 'timeline' && (
          <TimelineView
            items={invoices.map((inv) => ({
              id: inv.id,
              title: `${inv.reference} - ${inv.customerName}`,
              date: inv.createdAt,
              type: inv.status === 'paid' ? 'completed' as const : 'created' as const,
              description: `$${inv.totalAmount.toLocaleString()} - ${inv.status}`,
            }))}
          />
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={invoices.length < pageSize}>
            Next
          </Button>
        </div>
        </>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Invoice">
        <p className="text-sm text-slate-600">Delete {deleting?.reference}? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}