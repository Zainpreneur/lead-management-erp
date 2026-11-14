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
import type { HelpdeskTicket, TicketInput, Customer, Person } from '@/lib/types';
import { customerToOption } from '@/lib/combobox-helpers';
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/lib/types';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';

export default function TicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = React.useState<HelpdeskTicket[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<HelpdeskTicket | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<TicketInput>({ subject: '', description: '', type: 'general', category: 'general', priority: 'normal', status: 'New' });
  const [view, setView] = React.useState<'list' | 'board' | 'calendar' | 'timeline'>('list');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, p] = await Promise.all([api.listTickets({ limit: pageSize, page }), api.listCustomers(), api.people()]);
      setTickets(t.tickets);
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
      await api.createTicket(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Ticket created' });
      setForm({ subject: '', description: '', type: 'general', category: 'general', priority: 'normal', status: 'New' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create ticket', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (t: HelpdeskTicket) => {
    setEditing(t);
    setForm({ subject: t.subject, description: t.description, type: t.type, category: t.category, priority: t.priority, status: t.status, businessReference: t.businessReference, serviceRequestReference: t.serviceRequestReference, assignedTeam: t.assignedTeam, assignedTo: t.assignedTo, contactName: t.contactName, contactEmail: t.contactEmail });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateTicket(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Ticket updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update ticket', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const customerOptions = customers.map(customerToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Help Desk Tickets</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{tickets.length}</span>
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
              views={['list', 'board', 'calendar', 'timeline']}
              current={view}
              onChange={(v) => setView(v as 'list' | 'board' | 'calendar' | 'timeline')}
            />
          </div>

          {view === 'list' && (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{t.subject}</div>
                      <div className="text-xs text-slate-500">{t.reference} • {TICKET_STATUS_LABELS[t.status] ?? t.status} • {TICKET_PRIORITY_LABELS[t.priority] ?? t.priority}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-500">{t.assignedToName || 'Unassigned'}</div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(t)} className="text-xs text-brand-600 hover:underline">Edit</button>
                        <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteTicket(t.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{t.description}</p>
                </div>
              ))}
              {tickets.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No tickets.</div>}
            </div>
          )}

          {view === 'board' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {['New', 'Open', 'In Progress', 'Resolved'].map((status) => (
                <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{TICKET_STATUS_LABELS[status]}</h3>
                  <div className="space-y-2">
                    {tickets.filter((t) => t.status === status).map((t) => (
                      <div key={t.id} className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="text-sm font-medium text-slate-900">{t.subject}</div>
                        <div className="text-xs text-slate-500">{t.priority}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <CalendarView
              events={tickets.map((t) => ({
                id: t.id,
                title: t.subject,
                date: t.createdAt.split('T')[0],
                color: t.priority === 'urgent' ? 'bg-rose-500' : t.priority === 'high' ? 'bg-amber-500' : 'bg-sky-500',
              }))}
            />
          )}

          {view === 'timeline' && (
            <TimelineView
              items={tickets.map((t) => ({
                id: t.id,
                title: t.subject,
                date: t.createdAt,
                type: t.status === 'Resolved' ? 'completed' as const : 'created' as const,
                description: `${t.status} • ${t.priority} • ${t.type}`,
              }))}
            />
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={tickets.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Help Desk Ticket">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
            <Input value={form.subject ?? ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Customer"
                options={customerOptions}
                value={form.businessReference ?? ''}
                onChange={(v) => setForm({ ...form, businessReference: v || null })}
                placeholder="Search customer by name, phone, email, city..."
                recentKey="ticket-customer"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={form.type ?? 'general'} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="general">General</option>
                <option value="support">Support</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select value={form.category ?? 'general'} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="general">General</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'New'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
              <select value={form.assignedTo ? String(form.assignedTo) : ''} onChange={(e) => setForm({ ...form, assignedTo: e.target.value ? Number(e.target.value) : null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="">Unassigned</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Ticket">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Subject *</label>
            <Input value={form.subject ?? ''} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'New'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(TICKET_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resolution</label>
            <Textarea value={form.resolution ?? ''} onChange={(e) => setForm({ ...form, resolution: e.target.value })} rows={3} />
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
