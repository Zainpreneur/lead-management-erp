'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { VendorContract, Vendor } from '@/lib/types';
import { vendorToOption } from '@/lib/combobox-helpers';

export default function VendorContractsPage() {
  const toast = useToast();
  const [contracts, setContracts] = React.useState<VendorContract[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [form, setForm] = React.useState({ vendorReference: '', name: '', kind: 'contract', url: '', expiresAt: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, v] = await Promise.all([api.listVendorContracts({ limit: pageSize, page }), api.listVendors({ limit: 100 })]);
      setContracts(c.contracts);
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
      await api.createVendorContract({ vendorReference: form.vendorReference, name: form.name, kind: form.kind, url: form.url || null, expiresAt: form.expiresAt || null });
      setCreating(false);
      toast.add({ variant: 'success', title: 'Contract created' });
      setForm({ vendorReference: '', name: '', kind: 'contract', url: '', expiresAt: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create contract', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const vendorOptions = vendors.map(vendorToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Vendor Contracts</span>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.reference} • {c.vendorName || c.vendorReference} • {c.kind}</div>
                    {c.expiresAt && <div className="text-xs text-amber-600">Expires: {c.expiresAt.slice(0,10)}</div>}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.verified ? 'Verified' : 'Unverified'}
                    </span>
                    {!c.verified && <button onClick={() => api.verifyVendorContract(c.reference, 'admin').then(() => { toast.add({ variant: 'success', title: 'Verified' }); load(); })} className="text-xs text-brand-600 hover:underline">Verify</button>}
                  </div>
                </div>
                {c.url && <p className="mt-2 text-sm text-slate-600"><a href={c.url} target="_blank" rel="noopener" className="underline">{c.url}</a></p>}
              </div>
            ))}
            {contracts.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No vendor contracts.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={contracts.length < pageSize}>Next</Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Vendor Contract">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Vendor"
              required
              options={vendorOptions}
              value={form.vendorReference}
              onChange={(v) => setForm({ ...form, vendorReference: v })}
              placeholder="Search vendor by name, phone, email, city..."
              recentKey="vendor-contract-vendor"
              allowCreate={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contract Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kind</label>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              <option value="contract">Contract</option>
              <option value="nda">NDA</option>
              <option value="msa">MSA</option>
              <option value="sow">SOW</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">URL</label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expires At</label>
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
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
