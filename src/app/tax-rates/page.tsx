'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { TaxRate, Currency } from '@/lib/types';
import { TAX_TYPE_LABELS } from '@/lib/types';

export default function TaxRatesPage() {
  const toast = useToast();
  const [rates, setRates] = React.useState<TaxRate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', rate: 0, type: 'vat', isDefault: false });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listTaxRates();
      setRates(res.rates);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTaxRate(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Tax rate created' });
      setForm({ name: '', rate: 0, type: 'vat', isDefault: false });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create tax rate', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Tax Rates</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{rates.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3">
          {rates.map((r) => (
            <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.reference} • {TAX_TYPE_LABELS[r.type] ?? r.type} • {r.rate}%</div>
                </div>
                <div className="flex items-center gap-3">
                  {r.isDefault && <span className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Default</span>}
                  <button onClick={async () => { if (confirm('Delete?')) { await api.deleteTaxRate(r.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {rates.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No tax rates.</div>}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Tax Rate">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Rate (%)</label>
              <Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TAX_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} id="isDefault" />
            <label htmlFor="isDefault" className="text-sm text-slate-700">Default tax rate</label>
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