'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Employee, EmployeeInput, Person } from '@/lib/types';
import { EMPLOYMENT_TYPE_LABELS, EMPLOYEE_STATUS_LABELS } from '@/lib/types';

export default function EmployeesPage() {
  const toast = useToast();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<EmployeeInput>({ firstName: '', lastName: '', employmentType: 'full_time', classification: 'employee', status: 'active', baseSalary: 0, currency: 'USD' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([api.listEmployees({ limit: pageSize, page }), api.people()]);
      setEmployees(e.employees);
      setPeople(p.people);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEmployee(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Employee created' });
      setForm({ firstName: '', lastName: '', employmentType: 'full_time', classification: 'employee', status: 'active', baseSalary: 0, currency: 'USD' });
      await load();
    } catch (err) {
      toast.add({ variant: 'error', title: 'Could not create employee', description: err instanceof Error ? err.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ firstName: emp.firstName, lastName: emp.lastName, email: emp.email, phone: emp.phone, department: emp.department, position: emp.position, employmentType: emp.employmentType, classification: emp.classification, hireDate: emp.hireDate, terminationDate: emp.terminationDate, status: emp.status, baseSalary: emp.baseSalary, currency: emp.currency, managerId: emp.managerId, notes: emp.notes });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateEmployee(editing.reference, form);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Employee updated' });
      await load();
    } catch (err) {
      toast.add({ variant: 'error', title: 'Could not update employee', description: err instanceof Error ? err.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Employees</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{employees.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-slate-500">{emp.reference} • {emp.position || '—'} • {emp.department || '—'} • {EMPLOYEE_STATUS_LABELS[emp.status] ?? emp.status}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">{emp.email || '—'}</div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(emp)} className="text-xs text-brand-600 hover:underline">Edit</button>
                      <button onClick={async () => { if (confirm('Delete?')) { await api.deleteEmployee(emp.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {employees.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No employees.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={employees.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First Name *</label>
              <Input value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last Name *</label>
              <Input value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <Input value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Position</label>
              <Input value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Employment Type</label>
              <Select value={form.employmentType ?? 'full_time'} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Base Salary</label>
              <Input type="number" value={form.baseSalary ?? 0} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hire Date</label>
              <Input type="date" value={form.hireDate ?? ''} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Employee">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First Name *</label>
              <Input value={form.firstName ?? ''} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last Name *</label>
              <Input value={form.lastName ?? ''} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
              <Input value={form.department ?? ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Position</label>
              <Input value={form.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Base Salary</label>
              <Input type="number" value={form.baseSalary ?? 0} onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })} />
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