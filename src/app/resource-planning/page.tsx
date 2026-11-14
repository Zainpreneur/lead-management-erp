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
import type { ResourceAllocation, ResourceAllocationInput, Employee, Project } from '@/lib/types';
import { employeeToOption, projectToOption } from '@/lib/combobox-helpers';
import { ALLOCATION_TYPE_LABELS, ALLOCATION_STATUS_LABELS } from '@/lib/types';

export default function ResourcePlanningPage() {
  const toast = useToast();
  const [allocations, setAllocations] = React.useState<ResourceAllocation[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<ResourceAllocationInput>({ employeeReference: '', allocationType: 'project', startDate: new Date().toISOString().slice(0, 10), hoursPerWeek: 40, utilizationPercent: 100, status: 'active' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [a, e, p] = await Promise.all([api.listResourceAllocations({ limit: pageSize, page }), api.listEmployees(), api.listProjects()]);
      setAllocations(a.allocations);
      setEmployees(e.employees);
      setProjects(p.projects);
    } catch (err) { console.error(err); }
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
      await api.createResourceAllocation(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Allocation created' });
      setForm({ employeeReference: '', allocationType: 'project', startDate: new Date().toISOString().slice(0, 10), hoursPerWeek: 40, utilizationPercent: 100, status: 'active' });
      await load();
    } catch (err) {
      toast.add({ variant: 'error', title: 'Could not create allocation', description: err instanceof Error ? err.message : '' });
    } finally { setSubmitting(false); }
  };

  const employeeOptions = employees.map(employeeToOption);
  const projectOptions = projects.map(projectToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Resource Planning</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{allocations.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {allocations.map((a) => (
              <div key={a.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{a.employeeReference}</div>
                    <div className="text-xs text-slate-500">{a.reference} • {ALLOCATION_TYPE_LABELS[a.allocationType] ?? a.allocationType} • {a.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">{a.hoursPerWeek}h/week</div>
                      <div className="text-xs text-slate-500">{a.utilizationPercent}% utilization</div>
                    </div>
                    <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteResourceAllocation(a.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {allocations.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No allocations.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={allocations.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Resource Allocation">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Combobox
              label="Employee"
              required
              options={employeeOptions}
              value={form.employeeReference}
              onChange={(v) => setForm({ ...form, employeeReference: v })}
              placeholder="Search employee by name, email, department..."
              recentKey="resource-employee"
              allowCreate={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={form.allocationType ?? 'project'} onChange={(e) => setForm({ ...form, allocationType: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(ALLOCATION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Combobox
                label="Project"
                options={projectOptions}
                value={form.projectReference ?? ''}
                onChange={(v) => setForm({ ...form, projectReference: v || null })}
                placeholder="Search project by name, manager, customer..."
                recentKey="resource-project"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date *</label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <Input type="date" value={form.endDate ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hours/Week</label>
              <Input type="number" value={form.hoursPerWeek ?? 40} onChange={(e) => setForm({ ...form, hoursPerWeek: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Utilization %</label>
              <Input type="number" value={form.utilizationPercent ?? 100} onChange={(e) => setForm({ ...form, utilizationPercent: Number(e.target.value) })} />
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
