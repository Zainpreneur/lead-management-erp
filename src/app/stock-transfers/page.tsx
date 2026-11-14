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
import type { StockTransfer, Product } from '@/lib/types';
import { productToOption } from '@/lib/combobox-helpers';
import { STOCK_TRANSFER_STATUS_LABELS } from '@/lib/types';

export default function StockTransfersPage() {
  const toast = useToast();
  const [transfers, setTransfers] = React.useState<StockTransfer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [form, setForm] = React.useState({ fromLocation: '', toLocation: '', productReference: '', quantity: 1, notes: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([api.listStockTransfers({ limit: pageSize, page }), api.listProducts({ limit: 100 })]);
      setTransfers(t.transfers);
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
      await api.createStockTransfer({ fromLocation: form.fromLocation, toLocation: form.toLocation, productReference: form.productReference, quantity: Number(form.quantity), notes: form.notes || null });
      setCreating(false);
      toast.add({ variant: 'success', title: 'Transfer created' });
      setForm({ fromLocation: '', toLocation: '', productReference: '', quantity: 1, notes: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create transfer', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleComplete = async (ref: string) => {
    try {
      await api.updateStockTransferStatus(ref, 'completed');
      toast.add({ variant: 'success', title: 'Transfer completed' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not complete', description: e instanceof Error ? e.message : '' });
    }
  };

  const productOptions = products.map(productToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Stock Transfers</span>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {transfers.map((t) => (
              <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{t.reference}</div>
                    <div className="text-xs text-slate-500">{t.productName || t.productReference} • {t.quantity} units • {t.fromLocation} → {t.toLocation}</div>
                    <div className="text-xs text-slate-400">{STOCK_TRANSFER_STATUS_LABELS[t.status] ?? t.status} • {t.createdAt.slice(0, 10)}</div>
                  </div>
                  <div className="flex gap-2">
                    {t.status !== 'completed' && t.status !== 'cancelled' && (
                      <button onClick={() => handleComplete(t.reference)} className="text-xs text-emerald-600 hover:underline">Complete</button>
                    )}
                  </div>
                </div>
                {t.notes && <p className="mt-2 text-sm text-slate-600">{t.notes}</p>}
              </div>
            ))}
            {transfers.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No stock transfers.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={transfers.length < pageSize}>Next</Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Stock Transfer">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">From Location *</label>
              <Input value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">To Location *</label>
              <Input value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })} />
            </div>
          </div>
          <div>
            <Combobox
              label="Product"
              required
              options={productOptions}
              value={form.productReference}
              onChange={(v) => setForm({ ...form, productReference: v })}
              placeholder="Search product by name, SKU, price..."
              recentKey="stock-transfer-product"
              allowCreate={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quantity *</label>
            <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
