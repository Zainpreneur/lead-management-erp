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
import type { Asset, AssetInput, AssetCategory } from '@/lib/types';
import { ASSET_STATUS_LABELS } from '@/lib/types';

export default function AssetsPage() {
  const toast = useToast();
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Asset | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<AssetInput>({ name: '', status: 'acquired', purchasePrice: 0, currency: 'USD', conditionRating: 5 });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([api.listAssets({ limit: pageSize, page }), api.listAssetCategories()]);
      setAssets(a.assets);
      setCategories(c.categories);
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
      await api.createAsset(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Asset created' });
      setForm({ name: '', status: 'acquired', purchasePrice: 0, currency: 'USD', conditionRating: 5 });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create asset', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({ name: a.name, status: a.status, purchasePrice: a.purchasePrice, currency: a.currency, serialNumber: a.serialNumber, model: a.model, manufacturer: a.manufacturer, location: a.location, conditionRating: a.conditionRating, notes: a.notes, businessReference: a.businessReference });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateAsset(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Asset updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update asset', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleDeploy = async (ref: string) => {
    try {
      await api.deployAsset(ref, null, null, 'Deployed');
      toast.add({ variant: 'success', title: 'Asset deployed' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not deploy', description: e instanceof Error ? e.message : '' });
    }
  };

  const categoryOptions: import("@/components/ui/Combobox").ComboboxOption<AssetCategory>[] = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
    subtitle: [c.code, c.description, c.reference].filter(Boolean).join(' · '),
    badge: c.isArchived ? 'archived' : 'active',
    badgeVariant: c.isArchived ? ('destructive' as const) : ('success' as const),
    avatar: c.name.charAt(0).toUpperCase(),
    meta: c,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Assets</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{assets.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {assets.map((a) => (
              <div key={a.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.reference} • {ASSET_STATUS_LABELS[a.status] ?? a.status} • {a.categoryName || '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">${a.purchasePrice.toLocaleString()}</div>
                    <div className="flex gap-2">
                      {a.status === 'acquired' && (
                        <button onClick={() => handleDeploy(a.reference)} className="text-xs text-emerald-600 hover:underline">Deploy</button>
                      )}
                      <button onClick={() => openEdit(a)} className="text-xs text-brand-600 hover:underline">Edit</button>
                      <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteAsset(a.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
                {a.notes && <p className="mt-2 text-sm text-slate-600">{a.notes}</p>}
              </div>
            ))}
            {assets.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No assets.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={assets.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Asset">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Category"
                options={categoryOptions}
                value={form.categoryId ? String(form.categoryId) : ''}
                onChange={(v) => setForm({ ...form, categoryId: v ? Number(v) : null })}
                placeholder="Search category by name, code..."
                recentKey="asset-category"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'acquired'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(ASSET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Price</label>
              <Input type="number" value={form.purchasePrice ?? 0} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={form.currency ?? 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Serial Number</label>
              <Input value={form.serialNumber ?? ''} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Model</label>
              <Input value={form.model ?? ''} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Manufacturer</label>
              <Input value={form.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
              <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Condition (1-10)</label>
              <Input type="number" value={form.conditionRating ?? 5} onChange={(e) => setForm({ ...form, conditionRating: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Asset">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'acquired'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(ASSET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
              <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
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
    </div>
  );
}
