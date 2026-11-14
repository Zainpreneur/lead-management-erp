'use client';
export const dynamic = 'force-dynamic';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CustomerCard } from '@/components/lead/CustomerCard';
import { CustomerForm } from '@/components/lead/CustomerForm';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Customer, CustomerInput, Person } from '@/lib/types';
import { CUSTOMER_STATUS_LABELS } from '@/lib/types';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { MapView } from '@/components/views/MapView';
import { TimelineView } from '@/components/views/TimelineView';

export default function CustomersPage() {
  const toast = useToast();
  const [searchInput, setSearchInput] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [deleting, setDeleting] = React.useState<Customer | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [view, setView] = React.useState<'card' | 'list' | 'map' | 'timeline'>('card');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.listCustomers({ search: searchInput || undefined, status: status || undefined, limit: pageSize, page }),
        api.people(),
      ]);
      setCustomers(c.customers);
      setPeople(p.people);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchInput, status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleCreate = async (input: CustomerInput) => {
    setSubmitting(true);
    try {
      await api.createCustomer(input);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Customer created' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create customer', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: CustomerInput) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateCustomer(editing.reference, input);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Customer updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update customer', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteCustomer(deleting.reference);
      setDeleting(null);
      toast.add({ variant: 'success', title: 'Customer deleted' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete customer', description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Customers</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{customers.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search customers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-0 flex-1"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-32 shrink-0">
          <option value="">All statuses</option>
          {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
        <div className="mb-4">
          <ViewSwitcher
            views={['card', 'list', 'map', 'timeline']}
            current={view}
            onChange={(v) => setView(v as 'card' | 'list' | 'map' | 'timeline')}
          />
        </div>

        {view === 'card' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <CustomerCard key={c.id} customer={c} onEdit={() => setEditing(c)} onDelete={() => setDeleting(c)} />
            ))}
            {customers.length === 0 && (
              <div className="col-span-full rounded-md border border-dashed border-slate-300 bg-white py-12 text-center">
                <div className="text-lg font-medium text-slate-700">No customers found</div>
                <p className="mt-1 text-sm text-slate-500">Create a customer to get started.</p>
                <div className="mt-4">
                  <Button onClick={() => setCreating(true)}>+ New Customer</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'list' && (
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">MRR</th>
                  <th className="px-4 py-2">Total Value</th>
                  <th className="px-4 py-2">City</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{c.status}</span></td>
                    <td className="px-4 py-2">${c.mrr.toLocaleString()}</td>
                    <td className="px-4 py-2 font-medium">${c.totalValue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500">{c.city || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'map' && (
          <MapView
            items={customers.map((c) => ({
              id: c.id,
              title: c.name,
              location: c.city ? `${c.city}, ${c.country || ''}`.trim() : 'Unknown',
            }))}
          />
        )}

        {view === 'timeline' && (
          <TimelineView
            items={customers.map((c) => ({
              id: c.id,
              title: c.name,
              date: c.createdAt,
              type: 'created' as const,
              description: `${c.status} • MRR: $${c.mrr}`,
            }))}
          />
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={customers.length < pageSize}>
            Next
          </Button>
        </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Customer">
        <CustomerForm people={people} submitting={submitting} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Customer">
        {editing && (
          <CustomerForm initial={editing} people={people} submitting={submitting} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Customer">
        <p className="text-sm text-slate-600">Delete {deleting?.name}? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}