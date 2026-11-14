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
import type { VendorInvoice, VendorInvoiceLineInput, Vendor, VendorInvoicePaymentInput, VendorCreditNoteInput } from '@/lib/types';
import { vendorToOption } from '@/lib/combobox-helpers';
import { VENDOR_INVOICE_STATUS_LABELS } from '@/lib/types';

export default function VendorInvoicesPage() {
  const toast = useToast();
  const [invoices, setInvoices] = React.useState<VendorInvoice[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [detail, setDetail] = React.useState<VendorInvoice | null>(null);
  const [form, setForm] = React.useState({ vendorReference: '', sourcingRequestReference: '', currency: 'USD', subtotal: 0, discountAmount: 0, taxPercent: 0, issueDate: '', dueDate: '', notes: '', lines: [{ description: '', amount: 0, currency: 'USD' }] });
  const [paymentForm, setPaymentForm] = React.useState<{ amount: number; method: string; reference: string; note: string; vendorInvoiceReference: string } | null>(null);
  const [creditForm, setCreditForm] = React.useState<{ amount: number; reason: string; vendorInvoiceReference: string } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [i, v] = await Promise.all([api.listVendorInvoices({ limit: pageSize, page }), api.listVendors({ limit: 100 })]);
      setInvoices(i.invoices);
      setVendors(v.vendors);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const loadDetail = async (ref: string) => {
    try {
      const res = await api.getVendorInvoice(ref);
      setDetail(res.invoice);
      setPaymentForm({ amount: 0, method: '', reference: '', note: '', vendorInvoiceReference: ref });
      setCreditForm({ amount: 0, reason: '', vendorInvoiceReference: ref });
    } catch (e) { console.error(e); }
  };

  const updateLine = (idx: number, patch: Partial<{ description: string; amount: number; currency: string }>) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.map((li, i) => (i === idx ? { ...li, ...patch } : li)) }));
  };
  const addLine = () => setForm((prev) => ({ ...prev, lines: [...prev.lines, { description: '', amount: 0, currency: 'USD' }] }));
  const removeLine = (idx: number) => setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createVendorInvoice({ vendorReference: form.vendorReference, sourcingRequestReference: form.sourcingRequestReference || null, currency: form.currency, discountAmount: form.discountAmount, taxPercent: form.taxPercent, issueDate: form.issueDate || null, dueDate: form.dueDate || null, notes: form.notes || null, lines: form.lines.map((l) => ({ description: l.description || null, amount: l.amount, currency: l.currency })) });
      setCreating(false);
      toast.add({ variant: 'success', title: 'Vendor invoice created' });
      setForm({ vendorReference: '', sourcingRequestReference: '', currency: 'USD', subtotal: 0, discountAmount: 0, taxPercent: 0, issueDate: '', dueDate: '', notes: '', lines: [{ description: '', amount: 0, currency: 'USD' }] });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create invoice', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleIssue = async (ref: string) => {
    try { await api.issueVendorInvoice(ref); toast.add({ variant: 'success', title: 'Issued' }); setDetail(null); await load(); } catch (e) { toast.add({ variant: 'error', title: 'Could not issue', description: e instanceof Error ? e.message : '' }); }
  };
  const handleVoid = async (ref: string) => {
    if (!confirm('Void this invoice?')) return;
    try { await api.voidVendorInvoice(ref); toast.add({ variant: 'success', title: 'Voided' }); setDetail(null); await load(); } catch (e) { toast.add({ variant: 'error', title: 'Could not void', description: e instanceof Error ? e.message : '' }); }
  };

  const handleMatch = async (ref: string) => {
    try {
      const result = await api.matchVendorInvoice(ref);
      if (result.result.matched) {
        toast.add({ variant: 'success', title: 'Matched', description: 'Invoice matched with PO and Goods Receipt' });
      } else if (result.result.status === 'partial') {
        toast.add({ variant: 'warning', title: 'Partial Match', description: result.result.reason });
      } else {
        toast.add({ variant: 'error', title: 'Match Failed', description: result.result.reason });
      }
      await load();
      await loadDetail(ref);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not match', description: e instanceof Error ? e.message : '' });
    }
  };
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm) return;
    try { await api.recordVendorInvoicePayment(paymentForm); toast.add({ variant: 'success', title: 'Payment recorded' }); setPaymentForm({ ...paymentForm, amount: 0 }); await loadDetail(paymentForm.vendorInvoiceReference); } catch (e) { toast.add({ variant: 'error', title: 'Could not record payment', description: e instanceof Error ? e.message : '' }); }
  };
  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditForm) return;
    try { await api.recordVendorCreditNote(creditForm); toast.add({ variant: 'success', title: 'Credit note recorded' }); setCreditForm({ ...creditForm, amount: 0 }); await loadDetail(creditForm.vendorInvoiceReference); } catch (e) { toast.add({ variant: 'error', title: 'Could not record credit', description: e instanceof Error ? e.message : '' }); }
  };

  const vendorOptions = vendors.map(vendorToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Vendor Invoices</span>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {invoices.map((i) => (
              <div key={i.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{i.reference}</div>
                    <div className="text-xs text-slate-500">{i.vendorName || i.vendorReference} • {VENDOR_INVOICE_STATUS_LABELS[i.status] ?? i.status} • {i.currency} {i.total.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadDetail(i.reference)} className="text-xs text-brand-600 hover:underline">View</button>
                    {i.status === 'draft' && <button onClick={() => handleIssue(i.reference)} className="text-xs text-emerald-600 hover:underline">Issue</button>}
                    {i.status !== 'void' && i.status !== 'paid' && <button onClick={() => handleVoid(i.reference)} className="text-xs text-rose-600 hover:underline">Void</button>}
                  </div>
                </div>
              </div>
            ))}
            {invoices.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No vendor invoices.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={invoices.length < pageSize}>Next</Button>
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New Vendor Invoice">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Vendor"
              required
              options={vendorOptions}
              value={form.vendorReference}
              onChange={(v) => setForm({ ...form, vendorReference: v })}
              placeholder="Search vendor by name, phone, email, city..."
              recentKey="vendor-invoice-vendor"
              allowCreate={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Issue Date</label>
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Discount</label>
              <Input type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tax %</label>
              <Input type="number" step="0.01" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Lines</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addLine}>+ Add</Button>
            </div>
            <div className="space-y-2">
              {form.lines.map((li, idx) => (
                <div key={idx} className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
                  <Input placeholder="Description" value={li.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Amount" value={li.amount} onChange={(e) => updateLine(idx, { amount: Number(e.target.value) })} />
                    <Input placeholder="Currency" value={li.currency} onChange={(e) => updateLine(idx, { currency: e.target.value })} />
                  </div>
                  {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-xs text-rose-600 hover:underline">Remove</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.reference ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">{detail.vendorName || detail.vendorReference}</div>
                <div className="text-xs text-slate-500">{detail.reference} • {VENDOR_INVOICE_STATUS_LABELS[detail.status] ?? detail.status} • {detail.currency} {detail.total.toLocaleString()}</div>
                {detail.matchStatus && detail.matchStatus !== 'pending' && (
                  <div className="mt-1 flex gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      detail.matchStatus === 'matched' ? 'bg-emerald-100 text-emerald-700' :
                      detail.matchStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {detail.matchStatus === 'matched' ? 'Matched' :
                       detail.matchStatus === 'partial' ? `Partial (${Math.round((detail.matchedAmount || 0) / detail.total * 100)}%)` :
                       detail.matchStatus === 'exception' ? 'Exception' :
                       detail.matchStatus}
                    </span>
                    {detail.matchedAmount !== undefined && detail.matchedAmount > 0 && (
                      <span className="text-xs text-slate-500">Matched: {detail.currency} {detail.matchedAmount.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {detail.status === 'draft' && <button onClick={() => handleIssue(detail.reference)} className="text-xs text-emerald-600 hover:underline">Issue</button>}
                {detail.status !== 'void' && detail.status !== 'paid' && <button onClick={() => handleVoid(detail.reference)} className="text-xs text-rose-600 hover:underline">Void</button>}
                {detail.purchaseOrderReference && (detail.matchStatus === 'pending' || detail.matchStatus === 'partial') && (
                  <button onClick={() => handleMatch(detail.reference)} className="text-xs text-brand-600 hover:underline">Match</button>
                )}
              </div>
            </div>

            {/* Lines */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Lines</h3>
              <div className="space-y-1">
                {detail.lines.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1">
                    <span>{l.description || '—'}</span>
                    <span>{l.currency} {l.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm font-medium text-slate-900 pt-2">
                  <span>Total</span>
                  <span>{detail.currency} {detail.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Payments</h3>
              {detail.payments.length === 0 ? (
                <div className="text-xs text-slate-400">No payments recorded.</div>
              ) : (
                <div className="space-y-1">
                  {detail.payments.map((p) => (
                    <div key={p.id} className="text-xs text-slate-600">{p.paidAt.slice(0,10)} • {p.amount.toLocaleString()} {p.method ? `(${p.method})` : ''} {p.note ? `— ${p.note}` : ''}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Record Payment */}
            {detail.status !== 'void' && detail.status !== 'paid' && (
              <form onSubmit={handlePayment} className="space-y-2 p-3 rounded-md border border-slate-200 bg-slate-50">
                <h4 className="text-sm font-medium text-slate-700">Record Payment</h4>
                <Input type="number" placeholder="Amount" value={paymentForm?.amount ?? 0} onChange={(e) => setPaymentForm({ ...(paymentForm ?? { vendorInvoiceReference: detail.reference, amount: 0, method: '', reference: '', note: '' }), amount: Number(e.target.value) })} />
                <Input placeholder="Method (e.g. bank transfer)" value={paymentForm?.method ?? ''} onChange={(e) => setPaymentForm({ ...(paymentForm ?? { vendorInvoiceReference: detail.reference, amount: 0, method: '', reference: '', note: '' }), method: e.target.value })} />
                <Input placeholder="Reference" value={paymentForm?.reference ?? ''} onChange={(e) => setPaymentForm({ ...(paymentForm ?? { vendorInvoiceReference: detail.reference, amount: 0, method: '', reference: '', note: '' }), reference: e.target.value })} />
                <Input placeholder="Note" value={paymentForm?.note ?? ''} onChange={(e) => setPaymentForm({ ...(paymentForm ?? { vendorInvoiceReference: detail.reference, amount: 0, method: '', reference: '', note: '' }), note: e.target.value })} />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">Record Payment</Button>
                </div>
              </form>
            )}

            {/* Credit Notes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Credit Notes</h3>
              {detail.creditNotes.length === 0 ? (
                <div className="text-xs text-slate-400">No credit notes.</div>
              ) : (
                <div className="space-y-1">
                  {detail.creditNotes.map((c) => (
                    <div key={c.id} className="text-xs text-rose-600">{c.refundedAt.slice(0,10)} • {c.amount.toLocaleString()} {c.reason ? `— ${c.reason}` : ''}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Record Credit Note */}
            {detail.status !== 'void' && (
              <form onSubmit={handleCredit} className="space-y-2 p-3 rounded-md border border-slate-200 bg-slate-50">
                <h4 className="text-sm font-medium text-slate-700">Record Credit Note</h4>
                <Input type="number" placeholder="Amount" value={creditForm?.amount ?? 0} onChange={(e) => setCreditForm({ ...(creditForm ?? { vendorInvoiceReference: detail.reference, amount: 0, reason: '' }), amount: Number(e.target.value) })} />
                <Input placeholder="Reason" value={creditForm?.reason ?? ''} onChange={(e) => setCreditForm({ ...(creditForm ?? { vendorInvoiceReference: detail.reference, amount: 0, reason: '' }), reason: e.target.value })} />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">Record Credit</Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
