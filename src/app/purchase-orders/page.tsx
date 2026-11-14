'use client';
export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { PurchaseOrder, PurchaseOrderInput, Vendor, Product } from '@/lib/types';
import { vendorToOption, productToOption } from '@/lib/combobox-helpers';
import { PO_STATUS_LABELS } from '@/lib/types';

export default function PurchaseOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [receivingPO, setReceivingPO] = React.useState<PurchaseOrder | null>(null);
  const [receivingStatus, setReceivingStatus] = React.useState<{ poReference: string; items: Array<{ id: number; description: string; productReference: string | null; ordered: number; received: number; outstanding: number; fullyReceived: boolean }>; fullyReceived: boolean; partiallyReceived: boolean } | null>(null);
  const [receiveQtys, setReceiveQtys] = React.useState<Record<number, number>>({});
  const [submittingReceive, setSubmittingReceive] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<PurchaseOrderInput>({ vendorReference: '', status: 'draft', currency: 'USD', items: [{ description: '', quantity: 1, unitPrice: 0 }] });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [o, v, p] = await Promise.all([api.listPurchaseOrders({ limit: pageSize, page }), api.listVendors(), api.listProducts()]);
      setOrders(o.orders);
      setVendors(v.vendors);
      setProducts(p.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  const openReceive = async (po: PurchaseOrder) => {
    setReceivingPO(po);
    setReceiveQtys({});
    try {
      const res = await api.getPOReceiving(po.reference);
      setReceivingStatus(res.receiving);
    } catch (e) { console.error(e); setReceivingStatus(null); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
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
      await api.createPurchaseOrder(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Purchase order created' });
      setForm({ vendorReference: '', status: 'draft', currency: 'USD', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create purchase order', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const vendorOptions = vendors.map(vendorToOption);
  const productOptions = products.map(productToOption);

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
                      <button onClick={async () => { await api.updatePurchaseOrder(o.reference, { status: 'approved' }); toast.add({ variant: 'success', title: 'Approved' }); load(); }} className="text-xs text-brand-600 hover:underline">Approve</button>
                      <button onClick={async () => { if (confirm(`Delete?`)) { await api.deletePurchaseOrder(o.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
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

      <Modal open={creating} onClose={() => setCreating(false)} title="New Purchase Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Vendor"
              required
              options={vendorOptions}
              value={form.vendorReference}
              onChange={(v) => setForm({ ...form, vendorReference: v })}
              placeholder="Search vendor by name, phone, email, city..."
              recentKey="po-vendor"
              allowCreate={false}
            />
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
                  <Combobox
                    label="Product (optional)"
                    options={productOptions}
                    value={li.productReference ?? ''}
                    onChange={(v) => {
                      const prod = products.find((p) => p.reference === v);
                      if (prod) {
                        updateItem(idx, { productReference: prod.reference, description: prod.name, unitPrice: prod.price });
                      } else {
                        updateItem(idx, { productReference: '' });
                      }
                    }}
                    placeholder="Search product by name, SKU, price..."
                    allowCreate={false}
                  />
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!receivingPO} onClose={() => { setReceivingPO(null); setReceivingStatus(null); }} title={`Receive Goods — ${receivingPO?.reference ?? ''}`}>
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
            <div className="flex justify-end gap-2">
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
                    if (items.length === 0) { toast.add({ variant: 'warning', title: 'Enter a quantity to receive' }); setSubmittingReceive(false); return; }
                    await api.createGoodsReceipt({ poReference: receivingPO.reference, items });
                    toast.add({ variant: 'success', title: 'Goods received' });
                    setReceivingPO(null);
                    setReceivingStatus(null);
                    await load();
                  } catch (e) {
                    toast.add({ variant: 'error', title: 'Could not receive goods', description: e instanceof Error ? e.message : '' });
                  } finally { setSubmittingReceive(false); }
                }}
              >
                {submittingReceive ? 'Receiving...' : 'Receive'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Loading...</div>
        )}
      </Modal>
    </div>
  );
}
