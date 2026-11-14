'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/shadcn/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { listPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, createGoodsReceipt, getPOReceivingStatus, invoiceGate } from '@/actions/purchase-orders';
import { listVendors } from '@/actions/vendors';
import { listProducts } from '@/actions/products';
import type { PurchaseOrder, PurchaseOrderInput, Vendor, Product } from '@/lib/types';
import { PO_STATUS_LABELS } from '@/lib/types';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receivingPO, setReceivingPO] = React.useState<PurchaseOrder | null>(null);
  const [receivingStatus, setReceivingStatus] = React.useState<{ poReference: string; items: Array<{ id: number; description: string; productReference: string | null; ordered: number; received: number; outstanding: number; fullyReceived: boolean }>; fullyReceived: boolean; partiallyReceived: boolean } | null>(null);
  const [gateStatus, setGateStatus] = React.useState<{ allowed: boolean; reason: string; receivedValue: number; orderedValue: number; receivedPercent: number } | null>(null);
  const [receiveQtys, setReceiveQtys] = React.useState<Record<number, number>>({});
  const [submittingReceive, setSubmittingReceive] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<PurchaseOrderInput>({ vendorReference: '', status: 'draft', currency: 'USD', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
  const [showGate, setShowGate] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [o, v, p] = await Promise.all([
        listPurchaseOrders({ limit: pageSize, page }),
        listVendors(),
        listProducts()
      ]);
      setOrders(o.purchaseOrders);
      setVendors(v.vendors);
      setProducts(p.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  const openReceive = async (po: PurchaseOrder) => {
    setReceivingPO(po);
    setReceiveQtys({});
    try {
      const res = await getPOReceivingStatus(po.reference);
      setReceivingStatus(res || null);
    } catch (e) { console.error(e); setReceivingStatus(null); }
  };

  const openGate = async (poReference: string) => {
    setShowGate(poReference);
    try {
      const gate = await invoiceGate(poReference);
      setGateStatus(gate);
    } catch (e) { console.error(e); setGateStatus(null); }
  };

  React.useEffect(() => { load(); }, [load]);

  const updateItem = (idx: number, patch: Partial<{ productReference: string; description: string; quantity: number; unitPrice: number }>) => {
    setForm((prev) => ({ ...prev, items: prev.items?.map((li, i) => (i === idx ? { ...li, ...patch } : li)) }));
  };
  const addItem = () => setForm((prev) => ({ ...prev, items: [...(prev.items ?? []), { description: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (idx: number) => setForm((prev) => ({ ...prev, items: prev.items?.filter((_, i) => i !== idx) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPurchaseOrder(form as any);
      setCreating(false);
      toast.success('Purchase order created');
      setForm({ vendorReference: '', status: 'draft', currency: 'USD', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
      await load();
    } catch (e) {
      toast.error('Could not create purchase order', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleApprove = async (reference: string) => {
    try {
      await updatePurchaseOrder(reference, { status: 'approved' });
      toast.success('Approved');
      await load();
    } catch (e) {
      toast.error('Could not approve', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleDelete = async (reference: string) => {
    if (!confirm('Delete?')) return;
    try {
      await deletePurchaseOrder(reference);
      toast.success('Deleted');
      await load();
    } catch (e) {
      toast.error('Could not delete', { description: e instanceof Error ? e.message : '' });
    }
  };

  const vendorOptions = vendors.map(v => ({ value: v.reference, label: `${v.name} (${v.reference})` }));
  const productOptions = products.map(p => ({ value: p.reference, label: `${p.name} (${p.sku})` }));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Purchase Orders</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{orders.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{o.reference}</div>
                    <div className="text-xs text-slate-500">{o.vendorName} • {PO_STATUS_LABELS[o.status] ?? o.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-900">${o.totalAmount.toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button onClick={() => openReceive(o)} className="text-xs text-emerald-600 hover:underline">Receive</button>
                      <button onClick={() => handleApprove(o.reference)} className="text-xs text-brand-600 hover:underline">Approve</button>
                      <button onClick={() => openGate(o.reference)} className="text-xs text-blue-600 hover:underline">3-Way Match</button>
                      <button onClick={() => handleDelete(o.reference)} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No purchase orders.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={orders.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Select value={form.vendorReference} onValueChange={(v) => setForm({ ...form, vendorReference: v })}>
              <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {vendorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Line Items</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Add</Button>
            </div>
            <div className="space-y-3">
              {form.items?.map((li, idx) => (
                <div key={idx} className="rounded-md border border-slate-200 bg-white p-3">
                  <Select value={li.productReference ?? ''} onValueChange={(v) => {
                    const prod = products.find((p) => p.reference === v);
                    if (prod) {
                      updateItem(idx, { productReference: prod.reference, description: prod.name, unitPrice: prod.price });
                    } else {
                      updateItem(idx, { productReference: '' });
                    }
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {productOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Input placeholder="Description" value={li.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                    </div>
                    <Input type="number" placeholder="Qty" value={li.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                    <Input type="number" placeholder="Unit Price" value={li.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} />
                    { (form.items?.length ?? 0) > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="text-xs text-rose-600 hover:underline sm:col-span-4">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <Dialog open={!!receivingPO} onOpenChange={(open) => { if (!open) { setReceivingPO(null); setReceivingStatus(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Goods — {receivingPO?.reference ?? ''}</DialogTitle>
          </DialogHeader>
        {receivingStatus ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              {receivingStatus.fullyReceived ? (
                <span className="text-emerald-600 font-medium">Fully received</span>
              ) : receivingStatus.partiallyReceived ? (
                <span className="text-amber-600 font-medium">Partially received</span>
              ) : (
                <span className="text-slate-500">Nothing received yet</span>
              )}
            </div>
            <div className="space-y-3">
              {receivingStatus.items.map((it) => (
                <div key={it.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-slate-900 text-sm">{it.description}</div>
                    <div className="text-xs text-slate-500">Ordered {it.ordered} • Received {it.received} • Outstanding {it.outstanding}</div>
                  </div>
                  {!it.fullyReceived && (
                    <Input
                      type="number"
                      placeholder="Qty to receive"
                      value={receiveQtys[it.id] ?? ''}
                      onChange={(e) => setReceiveQtys((prev) => ({ ...prev, [it.id]: Number(e.target.value) }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => { setReceivingPO(null); setReceivingStatus(null); }}>Cancel</Button>
              <Button
                type="button"
                disabled={submittingReceive || receivingStatus.fullyReceived}
                onClick={async () => {
                  if (!receivingPO || !receivingStatus) return;
                  setSubmittingReceive(true);
                  try {
                    const items = receivingStatus.items
                      .filter((it) => !it.fullyReceived)
                      .map((it) => ({ poItemId: it.id, quantityReceived: receiveQtys[it.id] ?? 0 }))
                      .filter((it) => it.quantityReceived > 0);
                    if (items.length === 0) { toast.warning('Enter a quantity to receive'); setSubmittingReceive(false); return; }
                    await createGoodsReceipt({ poReference: receivingPO.reference, items, receivedDate: new Date().toISOString().slice(0, 10) });
                    toast.success('Goods received');
                    setReceivingPO(null);
                    setReceivingStatus(null);
                    await load();
                  } catch (e) {
                    toast.error('Could not receive goods', { description: e instanceof Error ? e.message : '' });
                  } finally { setSubmittingReceive(false); }
                }}
              >
                {submittingReceive ? 'Receiving...' : 'Receive'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Loading...</div>
        )}
      </DialogContent>
      </Dialog>

      <Dialog open={!!showGate} onOpenChange={() => setShowGate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>3-Way Match — {showGate}</DialogTitle>
          </DialogHeader>
        {gateStatus ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-slate-50">
              <span className="text-sm text-slate-600">Match Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${gateStatus.allowed ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {gateStatus.allowed ? 'MATCHED' : 'BLOCKED'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-slate-500 uppercase">Ordered Value</div>
                <div className="text-lg font-bold text-slate-900">${gateStatus.orderedValue.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-slate-500 uppercase">Received Value</div>
                <div className="text-lg font-bold text-slate-900">${gateStatus.receivedValue.toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-lg border bg-white">
                <div className="text-xs text-slate-500 uppercase">Match %</div>
                <div className="text-lg font-bold text-slate-900">${gateStatus.receivedPercent.toFixed(1)}%</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <div className="text-xs text-slate-500 uppercase">Reason</div>
              <div className="mt-1 text-sm">{gateStatus.reason}</div>
            </div>
            {gateStatus.allowed && (
              <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-600">
                ✅ This PO is cleared for invoicing. All goods have been received.
              </div>
            )}
            {!gateStatus.allowed && (
              <div className="p-3 bg-rose-50 rounded-lg text-sm text-rose-600">
                ⚠️ Invoice blocked — goods not fully received. Complete receiving before creating a vendor invoice.
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400">Loading...</div>
        )}
      </DialogContent>
      </Dialog>
    </div>
  );
}