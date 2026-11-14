'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Currency } from '@/lib/types';

export default function CurrenciesPage() {
  const toast = useToast();
  const [currencies, setCurrencies] = React.useState<Currency[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listCurrencies();
      setCurrencies(res.currencies);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCurrency(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Currency created' });
      setForm({ code: '', name: '', symbol: '', exchangeRate: 1, isDefault: false });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create currency', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Currencies</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{currencies.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3">
          {currencies.map((c) => (
            <div key={c.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{c.name} ({c.code})</div>
                  <div className="text-xs text-slate-500">{c.symbol} • Rate: {c.exchangeRate}</div>
                </div>
                <div className="flex items-center gap-3">
                  {c.isDefault && <span className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Default</span>}
                  <button onClick={async () => { if (confirm('Delete?')) { await api.deleteCurrency(c.code); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {currencies.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No currencies.</div>}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Currency">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Code *</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="USD" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="US Dollar" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Symbol</label>
              <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="$" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Exchange Rate</label>
              <Input type="number" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} id="isDefault" />
            <label htmlFor="isDefault" className="text-sm text-slate-700">Default currency</label>
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