'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { VendorPayout, Vendor } from '@/lib/types';
import { vendorToOption } from '@/lib/combobox-helpers';
import { VENDOR_PAYOUT_STATUS_LABELS, VENDOR_PAYOUT_TRIGGER_LABELS } from '@/lib/types';

export default function VendorPayoutsPage() {
  const toast = useToast();
  const [payouts, setPayouts] = React.useState<VendorPayout[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [form, setForm] = React.useState({ vendorReference: '', sourcingRequestReference: '', deliverable: '', amount: 0, triggerType: 'client_approval', status: 'pending', notes: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([api.listVendorPayouts({ limit: pageSize, page }), api.listVendors({ limit: 100 })]);
      setPayouts(p.payouts);
      setVendors(v.vendors);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createVendorPayout({ vendorReference: form.vendorReference, sourcingRequestReference: form.sourcingRequestReference || null, deliverable: form.deliverable, amount: Number(form.amount), triggerType: form.triggerType, status: form.status, notes: form.notes || null });
      setCreating(false);
      toast.add({ variant: 'success', title: 'Payout created' });
      setForm({ vendorReference: '', sourcingRequestReference: '', deliverable: '', amount: 0, triggerType: 'client_approval', status: 'pending', notes: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create payout', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleRelease = async (ref: string) => {
    try {
      await api.releaseVendorPayout(ref);
      toast.add({ variant: 'success', title: 'Payout released' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not release', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleStatusChange = async (ref: string, status: string) => {
    try {
      await api.updateVendorPayoutStatus(ref, status);
      toast.add({ variant: 'success', title: 'Status updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update', description: e instanceof Error ? e.message : '' });
    }
  };

  const vendorOptions = vendors.map(vendorToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Vendor Payouts</span>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {payouts.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{p.reference}</div>
                    <div className="text-xs text-slate-500">{p.vendorName || p.vendorReference} • {p.deliverable} • {VENDOR_PAYOUT_TRIGGER_LABELS[p.triggerType] ?? p.triggerType}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-900">${p.amount.toLocaleString()}</div>
                    <select value={p.status} onChange={(e) => handleStatusChange(p.reference, e.target.value)} className="text-xs border rounded px-2 py-1">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="released">Released</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    {!p.released && <button onClick={() => handleRelease(p.reference)} className="text-xs text-emerald-600 hover:underline">Release</button>}
                  </div>
                </div>
                {p.notes && <p className="mt-2 text-sm text-slate-600">{p.notes}</p>}
                {p.released && <div className="text-xs text-emerald-600">Released {p.releasedAt?.slice(0,10)} by {p.releasedBy}</div>}
              </div>
            ))}
            {payouts.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No vendor payouts.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={payouts.length < pageSize}>Next</Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Vendor Payout">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Vendor"
              required
              options={vendorOptions}
              value={form.vendorReference}
              onChange={(v) => setForm({ ...form, vendorReference: v })}
              placeholder="Search vendor by name, phone, email, city..."
              recentKey="vendor-payout-vendor"
              allowCreate={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deliverable *</label>
            <Input value={form.deliverable} onChange={(e) => setForm({ ...form, deliverable: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trigger Type</label>
              <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="client_approval">Client Approval</option>
                <option value="internal_signoff">Internal Signoff</option>
                <option value="deliverable_done">Deliverable Done</option>
                <option value="fixed_date">Fixed Date</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
