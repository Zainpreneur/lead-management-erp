'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function ReorderCandidatesPage() {
  const toast = useToast();
  const [candidates, setCandidates] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [rp, setRp] = React.useState(0);
  const [rq, setRq] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listReorderCandidates();
      setCandidates(res.candidates);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const openEdit = (p: Product) => {
    setEditing(p);
    setRp(p.reorderPoint);
    setRq(p.reorderQuantity);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateProduct(editing.reference, { reorderPoint: rp, reorderQuantity: rq });
      toast.add({ variant: 'success', title: 'Reorder levels updated' });
      setEditing(null);
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Reorder Candidates</span>
          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{candidates.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3">
          {candidates.map((p) => (
            <div key={p.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">Stock {p.stock} • Reorder point {p.reorderPoint} • Suggested reorder {p.reorderQuantity}</div>
                </div>
                <button onClick={() => openEdit(p)} className="text-xs text-brand-600 hover:underline">Edit levels</button>
              </div>
            </div>
          ))}
          {candidates.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No reorder candidates.</div>}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Reorder Levels">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reorder Point</label>
            <Input type="number" value={rp} onChange={(e) => setRp(Number(e.target.value))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Reorder Quantity</label>
            <Input type="number" value={rq} onChange={(e) => setRq(Number(e.target.value))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
