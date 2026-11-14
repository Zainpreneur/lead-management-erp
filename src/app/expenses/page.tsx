'use client';
export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Expense, ExpenseInput, Vendor, Asset } from '@/lib/types';
import { EXPENSE_STATUS_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/types';

export default function ExpensesPage() {
  const toast = useToast();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [editing, setEditing] = React.useState<Expense | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [form, setForm] = React.useState<ExpenseInput>({ title: '', category: 'general', amount: 0, status: 'pending', currency: 'USD', expenseDate: new Date().toISOString().slice(0, 10), notes: '', vendorReference: '', assetReference: '', purchaseOrderReference: '', assetCategory: '', isAssetPurchase: false });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [res, v, a] = await Promise.all([
        api.listExpenses({ limit: pageSize, page }),
        api.listVendors({ limit: 100 }),
        api.listAssets({ limit: 100 }),
      ]);
      setExpenses(res.expenses);
      setVendors(v.vendors);
      setAssets(a.assets);
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
      await api.createExpense(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Expense created' });
      setForm({ title: '', category: 'general', amount: 0, status: 'pending', currency: 'USD', expenseDate: new Date().toISOString().slice(0, 10), notes: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create expense', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (exp: Expense) => {
    setEditing(exp);
    setForm({ title: exp.title, category: exp.category, amount: exp.amount, currency: exp.currency, status: exp.status, expenseDate: exp.expenseDate, paidBy: exp.paidBy, notes: exp.notes, receiptUrl: exp.receiptUrl });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateExpense(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Expense updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update expense', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Expenses</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{expenses.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
        <div className="space-y-3">
          {expenses.map((exp) => (
            <div key={exp.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{exp.title}</div>
                  <div className="text-xs text-slate-500">{exp.reference} • {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category} • {EXPENSE_STATUS_LABELS[exp.status] ?? exp.status}</div>
                  {(exp.vendorReference || exp.assetReference) && (
                    <div className="mt-1 text-xs text-slate-500 flex gap-4">
                      {exp.vendorReference && <span>Vendor: {vendors.find(v => v.reference === exp.vendorReference)?.name || exp.vendorReference}</span>}
                      {exp.assetReference && <span>Asset: {assets.find(a => a.reference === exp.assetReference)?.name || exp.assetReference}</span>}
                    </div>
                  )}
                  {exp.assetCategory && <div className="mt-1 text-xs text-slate-500">Asset Category: {exp.assetCategory}</div>}
                  {exp.isAssetPurchase && <div className="mt-1 text-xs text-emerald-600">Asset Purchase</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-slate-900">${exp.amount.toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(exp)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    <button onClick={async () => { if (confirm('Delete?')) { await api.deleteExpense(exp.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No expenses.</div>}
        </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Expense">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(EXPENSE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
              <Select value={form.vendorReference ?? ''} onChange={(e) => setForm({ ...form, vendorReference: e.target.value })}>
                <option value="">None</option>
                {vendors.map((v) => <option key={v.id} value={v.reference}>{v.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Asset</label>
              <Select value={form.assetReference ?? ''} onChange={(e) => setForm({ ...form, assetReference: e.target.value })}>
                <option value="">None</option>
                {assets.map((a) => <option key={a.id} value={a.reference}>{a.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Order</label>
              <Input value={form.purchaseOrderReference ?? ''} onChange={(e) => setForm({ ...form, purchaseOrderReference: e.target.value })} placeholder="PO reference" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Asset Category</label>
              <Input value={form.assetCategory ?? ''} onChange={(e) => setForm({ ...form, assetCategory: e.target.value })} placeholder="e.g., IT Equipment, Furniture" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Asset Purchase</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isAssetPurchase} onChange={(e) => setForm({ ...form, isAssetPurchase: e.target.checked })} />
              <span className="text-sm text-slate-600">This expense is for an asset purchase</span>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Expense">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(EXPENSE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
              <Select value={form.vendorReference ?? ''} onChange={(e) => setForm({ ...form, vendorReference: e.target.value })}>
                <option value="">None</option>
                {vendors.map((v) => <option key={v.id} value={v.reference}>{v.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Asset</label>
              <Select value={form.assetReference ?? ''} onChange={(e) => setForm({ ...form, assetReference: e.target.value })}>
                <option value="">None</option>
                {assets.map((a) => <option key={a.id} value={a.reference}>{a.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Purchase Order</label>
              <Input value={form.purchaseOrderReference ?? ''} onChange={(e) => setForm({ ...form, purchaseOrderReference: e.target.value })} placeholder="PO reference" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Asset Category</label>
              <Input value={form.assetCategory ?? ''} onChange={(e) => setForm({ ...form, assetCategory: e.target.value })} placeholder="e.g., IT Equipment, Furniture" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Asset Purchase</label>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isAssetPurchase} onChange={(e) => setForm({ ...form, isAssetPurchase: e.target.checked })} />
              <span className="text-sm text-slate-600">This expense is for an asset purchase</span>
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