'use client';

import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/shadcn/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { listVendorPayouts, listVendors, createVendorPayout, releaseVendorPayout, updateVendorPayoutStatus } from '@/actions/vendors';
import type { VendorPayout, Vendor } from '@/lib/types';
import { VENDOR_PAYOUT_STATUS_LABELS, VENDOR_PAYOUT_TRIGGER_LABELS } from '@/lib/types';

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = React.useState<VendorPayout[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [form, setForm] = React.useState({ 
    vendorReference: '', sourcingRequestReference: '', deliverable: '', amount: 0, 
    triggerType: 'client_approval', status: 'pending', notes: '' 
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([
        listVendorPayouts({ limit: pageSize, page }),
        listVendors({ limit: 100, page })
      ]);
      setPayouts((p.payouts as unknown) as VendorPayout[]);
      setVendors((v.vendors as unknown) as Vendor[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createVendorPayout({
        vendorReference: form.vendorReference,
        sourcingRequestReference: form.sourcingRequestReference || null,
        deliverable: form.deliverable,
        amount: Number(form.amount),
        triggerType: form.triggerType,
        status: form.status,
        notes: form.notes || null
      });
      setCreating(false);
      toast.success('Payout created');
      setForm({ vendorReference: '', sourcingRequestReference: '', deliverable: '', amount: 0, triggerType: 'client_approval', status: 'pending', notes: '' });
      await load();
    } catch (e) {
      toast.error('Could not create payout', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleRelease = async (ref: string) => {
    try {
      await releaseVendorPayout(ref);
      toast.success('Payout released');
      await load();
    } catch (e) {
      toast.error('Could not release', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleStatusChange = async (ref: string, status: string) => {
    try {
      await updateVendorPayoutStatus(ref, status);
      toast.success('Status updated');
      await load();
    } catch (e) {
      toast.error('Could not update', { description: e instanceof Error ? e.message : '' });
    }
  };

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
                    <Select value={p.status} onValueChange={(v) => handleStatusChange(p.reference, v)}>
                      <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="released">Released</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {!p.released && <Button variant="ghost" size="sm" onClick={() => handleRelease(p.reference)} className="text-emerald-600 hover:text-emerald-700">Release</Button>}
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Vendor Payout</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vendor *</label>
              <Select value={form.vendorReference} onValueChange={(v) => setForm({ ...form, vendorReference: v })}>
                <SelectTrigger><SelectValue placeholder="Search vendor..." /></SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.reference} value={v.reference}>{v.name} ({v.reference})</SelectItem>)}
                </SelectContent>
              </Select>
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
                <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_approval">Client Approval</SelectItem>
                    <SelectItem value="internal_signoff">Internal Signoff</SelectItem>
                    <SelectItem value="deliverable_done">Deliverable Done</SelectItem>
                    <SelectItem value="fixed_date">Fixed Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}