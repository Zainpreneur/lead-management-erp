'use client';

export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription } from '@/components/ui/shadcn/toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { listAssets, createAsset, updateAsset, deleteAsset, disposeAsset, deployAsset, listAssetCategories } from '@/actions/assets';
import type { Asset, AssetInput, AssetCategory } from '@/lib/types';
import { ASSET_STATUS_LABELS, ASSET_MAINTENANCE_TYPE_LABELS } from '@/lib/types';
import { X } from 'lucide-react';

type AssetRow = Asset & { open?: boolean; terminal?: boolean };

export default function AssetsPage() {
  const toast = useToast();
  const [assets, setAssets] = React.useState<AssetRow[]>([]);
  const [categories, setCategories] = React.useState<AssetCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Asset | null>(null);
  const [disposing, setDisposing] = React.useState<Asset | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<AssetInput>({ name: '', status: 'acquired', purchasePrice: 0, currency: 'USD', conditionRating: 5 });
  const [disposeForm, setDisposeForm] = React.useState({
    disposalDate: '',
    disposalMethod: 'sale' as const,
    disposalProceeds: 0,
    disposalCost: 0,
    disposalNotes: '',
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        listAssets({ limit: pageSize, page }),
        listAssetCategories()
      ]);
      setAssets(a.assets as AssetRow[]);
      setCategories(c.categories);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAsset(form as any);
      setCreating(false);
      toast.success('Asset created');
      setForm({ name: '', status: 'acquired', purchasePrice: 0, currency: 'USD', conditionRating: 5 });
      await load();
    } catch (e) {
      toast.error('Could not create asset', { description: e instanceof Error ? e.message : '' });
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
      await updateAsset(editing.reference, form as any);
      setEditing(null);
      toast.success('Asset updated');
      await load();
    } catch (e) {
      toast.error('Could not update asset', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (reference: string) => {
    if (!confirm('Delete?')) return;
    try {
      await deleteAsset(reference);
      toast.success('Deleted');
      await load();
    } catch (e) {
      toast.error('Could not delete', { description: e instanceof Error ? e.message : '' });
    }
  };

  const handleDeploy = async (ref: string) => {
    try {
      await deployAsset(ref, null, null, 'Deployed');
      toast.success('Asset deployed');
      await load();
    } catch (e) {
      toast.error('Could not deploy', { description: e instanceof Error ? e.message : '' });
    }
  };

  const openDispose = (a: Asset) => {
    setDisposing(a);
    setDisposeForm({ disposalDate: new Date().toISOString().slice(0, 10), disposalMethod: 'sale' as const, disposalProceeds: 0, disposalCost: 0, disposalNotes: '' });
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposing) return;
    setSubmitting(true);
    try {
      await disposeAsset(disposing.reference, disposeForm);
      toast.success('Asset disposed');
      setDisposing(null);
      await load();
    } catch (e) {
      toast.error('Could not dispose asset', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  React.useEffect(() => { load(); }, [page]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Assets</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{assets.length}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <a href="/assets/depreciation">Depreciation</a>
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
                      {(a.status === 'deployed' || a.status === 'maintaining') && (
                        <button onClick={() => openDispose(a)} className="text-xs text-rose-600 hover:underline">Dispose</button>
                      )}
                      <button onClick={() => openEdit(a)} className="text-xs text-brand-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(a.reference)} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
                {a.notes && <p className="mt-2 text-sm text-slate-600">{a.notes}</p>}
                {a.vendorReference && (
                  <div className="mt-2 text-xs text-slate-500">Supplier: {a.vendorName || a.vendorReference}</div>
                )}
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

      {creating && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 z-50 bg-black/80" />
          <div className="relative z-50 w-full max-w-lg">
            <div className="border border-slate-200 bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Asset</h3>
                <button onClick={() => setCreating(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
                  <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Select value={form.categoryId ? String(form.categoryId) : ''} onValueChange={(v) => setForm({ ...form, categoryId: v ? Number(v) : null })}>
                      <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                    <Select value={form.status ?? 'acquired'} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASSET_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Price</label>
                    <Input type="number" value={form.purchasePrice ?? 0} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                    <Input value={form.currency ?? 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
          </div>
        </div>
      )}

      {disposing && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 z-50 bg-black/80" />
          <div className="relative z-50 w-full max-w-lg">
            <div className="border border-slate-200 bg-white rounded-lg p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dispose Asset — {disposing?.name ?? ''}</h3>
                <button onClick={() => setDisposing(null)} className="text-xs text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleDispose} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Disposal Date *</label>
                    <Input type="date" value={disposeForm.disposalDate} onChange={(e) => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Disposal Method</label>
                    <Select value={disposeForm.disposalMethod} onValueChange={(v) => setDisposeForm({ ...disposeForm, disposalMethod: v as any })}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="scrap">Scrap</SelectItem>
                        <SelectItem value="donation">Donation</SelectItem>
                        <SelectItem value="trade_in">Trade In</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Proceeds ($)</label>
                    <Input type="number" value={disposeForm.disposalProceeds} onChange={(e) => setDisposeForm({ ...disposeForm, disposalProceeds: Number(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Disposal Cost ($)</label>
                    <Input type="number" value={disposeForm.disposalCost} onChange={(e) => setDisposeForm({ ...disposeForm, disposalCost: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                  <Textarea value={disposeForm.disposalNotes} onChange={(e) => setDisposeForm({ ...disposeForm, disposalNotes: e.target.value })} rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setDisposing(null)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Disposing...' : 'Dispose Asset'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}