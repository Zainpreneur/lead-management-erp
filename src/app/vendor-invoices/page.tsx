'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/shadcn/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { listVendorInvoices, createVendorInvoice, matchVendorInvoice, autoMatchVendorInvoices, issueVendorInvoice, voidVendorInvoice } from '@/actions/vendor-invoices';
import { listVendors } from '@/actions/vendors';
import type { VendorInvoice, Vendor } from '@/lib/types';
import { PO_STATUS_LABELS } from '@/lib/types';

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [matching, setMatching] = React.useState(false);
  const [form, setForm] = React.useState({
    vendorReference: '',
    sourcingRequestReference: '',
    purchaseOrderReference: '',
    goodsReceiptReference: '',
    status: 'draft',
    currency: 'USD',
    subtotal: 0,
    discountAmount: 0,
    taxPercent: 0,
    taxAmount: 0,
    total: 0,
    issueDate: '',
    dueDate: '',
    notes: '',
    lines: [{ description: '', amount: 0, currency: 'USD' }],
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [inv, v] = await Promise.all([
        listVendorInvoices({ limit: pageSize, page }),
        listVendors()
      ]);
      setInvoices(inv.vendorInvoices);
      setVendors(v.vendors);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createVendorInvoice(form);
      setCreating(false);
      toast.success('Vendor invoice created');
      setForm({
        vendorReference: '', sourcingRequestReference: '', purchaseOrderReference: '',
        goodsReceiptReference: '', status: 'draft', currency: 'USD',
        subtotal: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, total: 0,
        issueDate: '', dueDate: '', notes: '',
        lines: [{ description: '', amount: 0, currency: 'USD' }],
      });
      await load();
    } catch (e) {
      toast.error('Could not create vendor invoice', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleMatch = async (reference: string) => {
    try {
      const result = await matchVendorInvoice(reference);
      if (result.matched) {
        toast.success('Invoice matched successfully');
      } else {
        toast.warning('Partial match', { description: result.reason });
      }
      await load();
    } catch (e) {
      toast.error('Match failed', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleAutoMatch = async () => {
    setMatching(true);
    try {
      const result = await autoMatchVendorInvoices();
      toast.success(`Auto-match complete: ${result.matched}/${result.processed} matched, ${result.exceptions} exceptions`);
      await load();
    } catch (e) {
      toast.error('Auto-match failed', { description: e instanceof Error ? e.message : '' });
    } finally { setMatching(false); }
  };

  const handleIssue = async (reference: string) => {
    try {
      await issueVendorInvoice(reference);
      toast.success('Invoice issued');
      await load();
    } catch (e) {
      toast.error('Could not issue', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleVoid = async (reference: string) => {
    if (!confirm('Void this invoice?')) return;
    try {
      await voidVendorInvoice(reference);
      toast.success('Invoice voided');
      await load();
    } catch (e) {
      toast.error('Could not void', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleDeleteLine = (idx: number) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const handleAddLine = () => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, { description: '', amount: 0, currency: 'USD' }] }));
  };

  const handleLineChange = (idx: number, field: keyof { description?: string | null; amount: number; currency?: string }, value: any) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...prev, lines };
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const vendorOptions = vendors.map(v => ({ value: v.reference, label: `${v.name} (${v.reference})` }));

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Vendor Invoices</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{invoices.length}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAutoMatch} disabled={matching}>
              {matching ? 'Matching...' : 'Auto-Match All'}
            </Button>
            <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{inv.reference}</div>
                    <div className="text-xs text-slate-500">{inv.vendorName || inv.vendorReference} • {inv.status} • Match: {inv.matchStatus}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-900">${inv.total.toLocaleString()}</div>
                    <div className="flex gap-2">
                      {inv.matchStatus === 'pending' && (
                        <button onClick={() => handleMatch(inv.reference)} className="text-xs text-blue-600 hover:underline">Match</button>
                      )}
                      {inv.status === 'draft' && (
                        <button onClick={() => handleIssue(inv.reference)} className="text-xs text-brand-600 hover:underline">Issue</button>
                      )}
                      <button onClick={() => handleVoid(inv.reference)} className="text-xs text-rose-600 hover:underline">Void</button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {inv.lines.map((line: any, idx: number) => (
                    <div key={idx} className="text-xs text-slate-600 flex justify-between">
                      <span>{line.description}</span>
                      <span>${line.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="text-xs text-slate-400 text-right">
                    Match Amount: ${inv.matchedAmount.toLocaleString()} / Total: ${inv.total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No vendor invoices.</div>}
          </div>
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Vendor Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Select value={form.vendorReference} onValueChange={(v) => handleFieldChange('vendorReference', v)}>
                <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                <SelectContent>
                  {vendorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status} onValueChange={(v) => handleFieldChange('status', v)}>
                <SelectTrigger><SelectValue placeholder="Draft" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">PO Reference</label>
              <Input value={form.purchaseOrderReference} onChange={(e) => handleFieldChange('purchaseOrderReference', e.target.value)} placeholder="PO-0001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">GR Reference</label>
              <Input value={form.goodsReceiptReference} onChange={(e) => handleFieldChange('goodsReceiptReference', e.target.value)} placeholder="GR-0001" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Total</label>
              <Input type="number" value={form.total} onChange={(e) => handleFieldChange('total', Number(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Line Items</h2>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLine}>+ Add Line</Button>
            </div>
            <div className="space-y-3">
              {form.lines.map((line, idx) => (
                <div key={idx} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Input placeholder="Description" value={line.description ?? ''} onChange={(e) => handleLineChange(idx, 'description', e.target.value)} />
                    </div>
                    <Input type="number" placeholder="Amount" value={line.amount} onChange={(e) => handleLineChange(idx, 'amount', Number(e.target.value) || 0)} />
                    <Select value={line.currency ?? 'USD'} onValueChange={(v) => handleLineChange(idx, 'currency', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Currency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <button type="button" onClick={() => handleDeleteLine(idx)} className="text-xs text-rose-600 hover:underline">Remove</button>
                  </div>
                </div>
              ))}
              {form.lines.length === 0 && <div className="text-sm text-slate-400 text-center">No line items.</div>}
            </div>
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