'use client';

import * as React from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/shadcn/select';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/shadcn/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { GanttView } from '@/components/views/GanttView';
import { LeadBoard } from '@/components/lead/LeadBoard';
import { listTasks, createTask, updateTask, deleteTask } from '@/actions/tasks';
import { listPeople } from '@/actions/people';
import type { Task, TaskInput, Person } from '@/lib/types';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/types';

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Task | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<TaskInput>({ title: '', status: 'open', priority: 'medium' });
  const [view, setView] = React.useState<'list' | 'board' | 'calendar' | 'timeline' | 'gantt'>('list');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        listTasks({ limit: pageSize, page }),
        listPeople()
      ]);
      setTasks((t.tasks as unknown) as Task[]);
      setPeople((p.people as unknown) as Person[]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTask(form);
      setCreating(false);
      toast.success('Task created');
      setForm({ title: '', status: 'open', priority: 'medium' });
      await load();
    } catch (e) {
      toast.error('Could not create task', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ title: t.title, description: t.description, status: t.status, priority: t.priority, dueDate: t.dueDate, assignedTo: t.assignedTo });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await updateTask(editing.reference, form);
      setEditing(null);
      toast.success('Task updated');
      await load();
    } catch (e) {
      toast.error('Could not update task', { description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (reference: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(reference);
      toast.success('Task deleted');
      await load();
    } catch (e) {
      toast.error('Could not delete task', { description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Tasks</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{tasks.length}</span>
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
            {tasks.map((t) => (
              <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-500">{t.reference} • {TASK_STATUS_LABELS[t.status] ?? t.status} • {TASK_PRIORITY_LABELS[t.priority] ?? t.priority}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-500">{t.dueDate || 'No due date'}</div>
                    <button onClick={() => openEdit(t)} className="text-xs text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(t.reference)} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
                {t.description && <p className="mt-2 text-sm text-slate-600">{t.description}</p>}
              </div>
            ))}
            {tasks.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No tasks.</div>}
          </div>
        )}

        {view === 'board' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['open', 'in_progress', 'done', 'cancelled'].map((status) => (
              <div key={status} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{TASK_STATUS_LABELS[status]}</h3>
                <div className="space-y-2">
                  {tasks.filter((t) => t.status === status).map((t) => (
                    <div key={t.id} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="text-sm font-medium text-slate-900">{t.title}</div>
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
            events={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              date: t.dueDate || t.createdAt,
              color: t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500',
            }))}
          />
        )}

        {view === 'timeline' && (
          <TimelineView
            items={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              date: t.createdAt,
              type: t.status === 'done' ? 'completed' as const : 'created' as const,
              description: t.description || undefined,
            }))}
          />
        )}

        {view === 'gantt' && (
          <GanttView
            items={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              startDate: t.createdAt.split('T')[0],
              endDate: (t.dueDate || new Date(new Date(t.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
              progress: t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 0,
              color: t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500',
            }))}
          />
        )}

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm text-slate-600">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={tasks.length < pageSize}>
            Next
          </Button>
        </div>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
              <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select value={form.status ?? 'open'} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                <Select value={form.priority ?? 'medium'} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
                <Input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
                <Select value={form.assignedTo ? String(form.assignedTo) : ''} onValueChange={(v) => setForm({ ...form, assignedTo: v ? Number(v) : null })}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {people.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
              <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <Select value={form.status ?? 'open'} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
                <Select value={form.priority ?? 'medium'} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
                <Input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Assigned To</label>
                <Select value={form.assignedTo ? String(form.assignedTo) : ''} onValueChange={(v) => setForm({ ...form, assignedTo: v ? Number(v) : null })}>
                  <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {people.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}