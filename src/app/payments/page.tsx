'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { Payment, PaymentInput, Invoice } from '@/lib/types';
import { invoiceToOption } from '@/lib/combobox-helpers';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types';

export default function PaymentsPage() {
  const toast = useToast();
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Payment | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<PaymentInput>({ invoiceReference: '', amount: 0, method: 'cash', status: 'completed', notes: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, inv] = await Promise.all([
        api.listPayments({ limit: pageSize, page }),
        api.listInvoices(),
      ]);
      setPayments(p.payments);
      setInvoices(inv.invoices);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createPayment(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Payment recorded' });
      setForm({ invoiceReference: '', amount: 0, method: 'cash', status: 'completed', notes: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not record payment', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (p: Payment) => {
    setEditing(p);
    setForm({ invoiceReference: p.invoiceReference, amount: p.amount, method: p.method, status: p.status, paidAt: p.paidAt, notes: p.notes });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updatePayment(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Payment updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update payment', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const invoiceOptions = invoices.map(invoiceToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Payments</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{payments.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{p.reference}</div>
                  <div className="text-xs text-slate-500">{p.invoiceReference} • {PAYMENT_METHOD_LABELS[p.method] ?? p.method}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-slate-900">${p.amount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    <button onClick={async () => { if (confirm(`Delete?`)) { await api.deletePayment(p.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {payments.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No payments recorded.</div>}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={payments.length < pageSize}>
            Next
          </Button>
        </div>
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Payment">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={creating} onClose={() => setCreating(false)} title="Record Payment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Invoice"
              required
              options={invoiceOptions}
              value={form.invoiceReference}
              onChange={(v) => setForm({ ...form, invoiceReference: v })}
              placeholder="Search invoice by reference, customer, amount..."
              recentKey="payment-invoice"
              allowCreate={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Record'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
