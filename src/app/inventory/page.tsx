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
import type { InventoryAdjustment, Product } from '@/lib/types';
import { productToOption } from '@/lib/combobox-helpers';
import { INVENTORY_ADJUSTMENT_TYPE_LABELS } from '@/lib/types';

export default function InventoryPage() {
  const toast = useToast();
  const [adjustments, setAdjustments] = React.useState<InventoryAdjustment[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState({ productReference: '', type: 'adjustment', quantity: 0, reason: '', notes: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, p] = await Promise.all([api.listInventoryAdjustments({ limit: pageSize, page }), api.listProducts()]);
      setAdjustments(a.adjustments);
      setProducts(p.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createInventoryAdjustment(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Adjustment recorded' });
      setForm({ productReference: '', type: 'adjustment', quantity: 0, reason: '', notes: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not record adjustment', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const productOptions = products.map(productToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Inventory</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{adjustments.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {/* Product Stock Overview */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Product Stock</h2>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-2">
              <div>
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">{p.reference} • {p.sku || '—'}</div>
              </div>
              <div className="text-sm font-bold text-slate-900">{p.stock}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustments */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Adjustments</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <>
            <div className="space-y-3">
              {adjustments.map((a) => (
                <div key={a.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{a.reference}</div>
                      <div className="text-xs text-slate-500">{a.productReference} • {INVENTORY_ADJUSTMENT_TYPE_LABELS[a.type] ?? a.type} • {a.reason || '—'}</div>
                    </div>
                    <div className={`font-bold ${a.quantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {a.quantity >= 0 ? '+' : ''}{a.quantity}
                    </div>
                  </div>
                </div>
              ))}
              {adjustments.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No adjustments.</div>}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-600">Page {page}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={adjustments.length < pageSize}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New Inventory Adjustment">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Product"
              required
              options={productOptions}
              value={form.productReference}
              onChange={(v) => setForm({ ...form, productReference: v })}
              placeholder="Search product by name, SKU, price..."
              recentKey="inventory-product"
              allowCreate={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(INVENTORY_ADJUSTMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantity *</label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
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
