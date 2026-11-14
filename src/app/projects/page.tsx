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
import type { Project, ProjectInput, Employee, Customer } from '@/lib/types';
import { customerToOption, employeeToOption } from '@/lib/combobox-helpers';
import { PROJECT_STATUS_LABELS } from '@/lib/types';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { GanttView } from '@/components/views/GanttView';

export default function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<ProjectInput>({ name: '', status: 'planning', priority: 'medium', budget: 0, currency: 'USD' });
  const [view, setView] = React.useState<'list' | 'board' | 'calendar' | 'timeline' | 'gantt'>('list');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, e, c] = await Promise.all([api.listProjects({ limit: pageSize, page }), api.listEmployees(), api.listCustomers()]);
      setProjects(p.projects);
      setEmployees(e.employees);
      setCustomers(c.customers);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createProject(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Project created' });
      setForm({ name: '', status: 'planning', priority: 'medium', budget: 0, currency: 'USD' });
      await load();
    } catch (err) {
      toast.add({ variant: 'error', title: 'Could not create project', description: err instanceof Error ? err.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, status: p.status, priority: p.priority, startDate: p.startDate, endDate: p.endDate, budget: p.budget, currency: p.currency, managerId: p.managerId, customerReference: p.customerReference });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateProject(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Project updated' });
      await load();
    } catch (err) {
      toast.add({ variant: 'error', title: 'Could not update project', description: err instanceof Error ? err.message : '' });
    } finally { setSubmitting(false); }
  };

  const customerOptions = customers.map(customerToOption);
  const employeeOptions = employees.map(employeeToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Projects</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{projects.length}</span>
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
              {projects.map((p) => (
                <div key={p.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.reference} • {PROJECT_STATUS_LABELS[p.status] ?? p.status} • {p.priority}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-500">{p.managerName || '—'}</div>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs text-brand-600 hover:underline">Edit</button>
                        <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteProject(p.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                      </div>
                    </div>
                  </div>
                  {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
                </div>
              ))}
              {projects.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No projects.</div>}
            </div>
          )}

          {view === 'board' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((status) => (
                <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{PROJECT_STATUS_LABELS[status]}</h3>
                  <div className="space-y-2">
                    {projects.filter((p) => p.status === status).map((p) => (
                      <div key={p.id} className="rounded-md border border-slate-200 bg-white p-2">
                        <div className="text-sm font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.priority}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <CalendarView
              events={projects.map((p) => ({
                id: p.id,
                title: p.name,
                date: p.startDate || p.createdAt.split('T')[0],
                color: p.status === 'completed' ? 'bg-emerald-500' : p.status === 'active' ? 'bg-brand-500' : 'bg-slate-400',
              }))}
            />
          )}

          {view === 'timeline' && (
            <TimelineView
              items={projects.map((p) => ({
                id: p.id,
                title: p.name,
                date: p.createdAt,
                type: p.status === 'completed' ? 'completed' as const : 'created' as const,
                description: p.description || undefined,
              }))}
            />
          )}

          {view === 'gantt' && (
            <GanttView
              items={projects.map((p) => ({
                id: p.id,
                title: p.name,
                startDate: p.startDate || p.createdAt.split('T')[0],
                endDate: p.endDate || new Date(new Date(p.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                progress: p.status === 'completed' ? 100 : p.status === 'active' ? 50 : 0,
                color: p.status === 'completed' ? 'bg-emerald-500' : p.status === 'active' ? 'bg-brand-500' : 'bg-slate-400',
              }))}
            />
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={projects.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Project">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Combobox
                label="Customer"
                options={customerOptions}
                value={form.customerReference ?? ''}
                onChange={(v) => setForm({ ...form, customerReference: v || null })}
                placeholder="Search customer by name, phone, email, city..."
                recentKey="project-customer"
                allowCreate={false}
              />
            </div>
            <div>
              <Combobox
                label="Manager"
                options={employeeOptions}
                value={form.managerId ? String(form.managerId) : ''}
                onChange={(v) => setForm({ ...form, managerId: v ? Number(v) : null })}
                placeholder="Search employee by name, email, department..."
                recentKey="project-manager"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'planning'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <Input type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <Input type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Budget</label>
              <Input type="number" value={form.budget ?? 0} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={form.currency ?? 'USD'} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Project">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status ?? 'planning'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
              <select value={form.priority ?? 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
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
