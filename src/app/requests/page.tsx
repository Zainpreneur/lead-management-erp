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
import type { ServiceRequest, ServiceRequestInput, Customer, Person } from '@/lib/types';
import { customerToOption } from '@/lib/combobox-helpers';
import { REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS } from '@/lib/types';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { GanttView } from '@/components/views/GanttView';

export default function RequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = React.useState<ServiceRequest[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ServiceRequest | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<ServiceRequestInput>({ title: '', status: 'Draft', priority: 'normal' });
  const [view, setView] = React.useState<'list' | 'board' | 'calendar' | 'timeline' | 'gantt'>('list');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [r, c, p] = await Promise.all([api.listRequests({ limit: pageSize, page }), api.listCustomers(), api.people()]);
      setRequests(r.requests);
      setCustomers(c.customers);
      setPeople(p.people);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createRequest(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Request created' });
      setForm({ title: '', status: 'Draft', priority: 'normal' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create request', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (r: ServiceRequest) => {
    setEditing(r);
    setForm({ title: r.title, status: r.status, priority: r.priority, businessReference: r.businessReference, contactName: r.contactName, contactEmail: r.contactEmail, contactRole: r.contactRole, assignedTeam: r.assignedTeam, assignedTo: r.assignedTo, requiredDate: r.requiredDate, specialRequirements: r.specialRequirements, finalAmount: r.finalAmount, currency: r.currency, notes: r.notes });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateRequest(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Request updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update request', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const customerOptions = customers.map(customerToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Service Requests</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{requests.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="mb-4">
            <ViewSwitcher
              views={['list', 'board', 'calendar', 'timeline', 'gantt']}
              current={view}
              onChange={(v) => setView(v as 'list' | 'board' | 'calendar' | 'timeline' | 'gantt')}
            />
          </div>

          {view === 'list' && (
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{r.title}</div>
                      <div className="text-xs text-slate-500">{r.reference} • {REQUEST_STATUS_LABELS[r.status] ?? r.status} • {REQUEST_PRIORITY_LABELS[r.priority] ?? r.priority}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-bold text-slate-900">${r.finalAmount.toLocaleString()}</div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="text-xs text-brand-600 hover:underline">Edit</button>
                        <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteRequest(r.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No requests.</div>}
            </div>
          )}

          {view === 'board' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {['Draft', 'Submitted', 'Approved', 'Completed'].map((status) => (
                <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{REQUEST_STATUS_LABELS[status]}</h3>
                  <div className="space-y-2">
                    {requests.filter((r) => r.status === status).map((r) => (
                      <div key={r.id} className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="text-sm font-medium text-slate-900">{r.title}</div>
                        <div className="text-xs text-slate-500">{r.priority}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <CalendarView
              events={requests.map((r) => ({
                id: r.id,
                title: r.title,
                date: r.requiredDate || r.createdAt.split('T')[0],
                color: r.priority === 'urgent' ? 'bg-rose-500' : r.priority === 'high' ? 'bg-amber-500' : 'bg-sky-500',
              }))}
            />
          )}

          {view === 'timeline' && (
            <TimelineView
              items={requests.map((r) => ({
                id: r.id,
                title: r.title,
                date: r.createdAt,
                type: r.status === 'Completed' ? 'completed' as const : 'created' as const,
                description: `${r.status} • ${r.priority}`,
              }))}
            />
          )}

          {view === 'gantt' && (
            <GanttView
              items={requests.map((r) => ({
                id: r.id,
                title: r.title,
                startDate: r.createdAt.split('T')[0],
                endDate: r.requiredDate || new Date(new Date(r.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: r.status === 'Completed' ? 100 : r.status === 'Approved' ? 50 : 0,
                color: r.priority === 'urgent' ? 'bg-rose-500' : r.priority === 'high' ? 'bg-amber-500' : 'bg-sky-500',
              }))}
            />
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={requests.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Service Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Customer"
                options={customerOptions}
                value={form.businessReference ?? ''}
                onChange={(v) => setForm({ ...form, businessReference: v || null })}
                placeholder="Search customer by name, phone, email, city..."
                recentKey="request-customer"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'Draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(REQUEST_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Required Date</label>
              <Input type="date" value={form.requiredDate ?? ''} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Special Requirements</label>
            <Textarea value={form.specialRequirements ?? ''} onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })} rows={3} />
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Service Request">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'Draft'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(REQUEST_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
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
