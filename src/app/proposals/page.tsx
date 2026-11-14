/* eslint-disable react/no-unescaped-entities */
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
import type { Proposal, ProposalInput, Lead, Customer, Product } from '@/lib/types';
import { customerToOption, leadToOption, productToOption } from '@/lib/combobox-helpers';
import { PROPOSAL_STATUS_LABELS } from '@/lib/types';


export default function ProposalsPage() {
  const toast = useToast();
  const [proposals, setProposals] = React.useState<Proposal[]>([]);
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Proposal | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<ProposalInput>({ title: '', status: 'draft', currency: 'USD', lines: [{ description: '', quantity: 1, unitPrice: 0 }] });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, l, c, pr] = await Promise.all([
        api.listProposals({ limit: pageSize, page }),
        api.listLeads(),
        api.listCustomers(),
        api.listProducts(),
      ]);
      setProposals(p.proposals);
      setLeads(l.leads);
      setCustomers(c.customers);
      setProducts(pr.products);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const updateLine = (idx: number, patch: Partial<{ productReference: string; description: string; quantity: number; unitPrice: number }>) => {
    setForm((prev) => ({ ...prev, lines: prev.lines?.map((li, i) => (i === idx ? { ...li, ...patch } : li)) }));
  };
  const addLine = () => setForm((prev) => ({ ...prev, lines: [...(prev.lines ?? []), { description: '', quantity: 1, unitPrice: 0 }] }));
  const removeLine = (idx: number) => setForm((prev) => ({ ...prev, lines: prev.lines?.filter((_, i) => i !== idx) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProposal(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Proposal created' });
      setForm({ title: '', status: 'draft', currency: 'USD', lines: [{ description: '', quantity: 1, unitPrice: 0 }] });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create proposal', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (p: Proposal) => {
    setEditing(p);
    setForm({ title: p.title, status: p.status, notes: p.notes, currency: p.currency });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateProposal(editing.reference, { title: form.title, status: form.status, notes: form.notes });
      setEditing(null);
      toast.add({ variant: 'success', title: 'Proposal updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update proposal', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const customerOptions = customers.map(customerToOption);
  const leadOptions = leads.map(leadToOption);
  const productOptions = products.map(productToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Proposals</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{proposals.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-xs text-slate-500">{p.reference} • {p.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold text-slate-900">${p.total.toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteProposal(p.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {proposals.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No proposals.</div>}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={proposals.length < pageSize}>
            Next
          </Button>
        </div>
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Proposal">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status ?? 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
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

      <Modal open={creating} onClose={() => setCreating(false)} title="New Proposal">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Lead"
                options={leadOptions}
                value={form.leadReference ?? ''}
                onChange={(v) => setForm({ ...form, leadReference: v || null })}
                placeholder="Search lead by name, email, phone, city..."
                recentKey="proposal-lead"
                allowCreate={false}
              />
            </div>
            <div>
              <Combobox
                label="Customer"
                options={customerOptions}
                value={form.customerReference ?? ''}
                onChange={(v) => setForm({ ...form, customerReference: v || null })}
                placeholder="Search customer by name, phone, email, city..."
                recentKey="proposal-customer"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={form.currency ?? 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Line Items</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addLine}>+ Add</Button>
            </div>
            <div className="space-y-3">
              {form.lines?.map((li, idx) => (
                <div key={idx} className="rounded-md border border-slate-200 bg-white p-3">
                  <Combobox
                    label="Product (optional)"
                    options={productOptions}
                    value={li.productReference ?? ''}
                    onChange={(v) => {
                      const prod = products.find((p) => p.reference === v);
                      if (prod) {
                        updateLine(idx, { productReference: prod.reference, description: prod.name, unitPrice: prod.price });
                      } else {
                        updateLine(idx, { productReference: '' });
                      }
                    }}
                    placeholder="Search product by name, SKU, price..."
                    allowCreate={false}
                  />
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <Input placeholder="Description" value={li.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </div>
                    <Input type="number" placeholder="Qty" value={li.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} />
                    <Input type="number" placeholder="Unit Price" value={li.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} />
                    { (form.lines?.length ?? 0) > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="text-xs text-rose-600 hover:underline sm:col-span-4">Remove</button>
                    )}
                  </div>
                </div>
              ))}
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
    </div>
  );
}
