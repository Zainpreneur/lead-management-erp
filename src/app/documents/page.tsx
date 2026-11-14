'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Document, DocumentInput } from '@/lib/types';

export default function DocumentsPage() {
  const toast = useToast();
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [form, setForm] = React.useState<DocumentInput>({ name: '', fileName: '', entityType: 'lead', entityReference: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listDocuments({ limit: pageSize, page });
      setDocuments(res.documents);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createDocument(form);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Document created' });
      setForm({ name: '', fileName: '', entityType: 'lead', entityReference: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create document', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Documents</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{documents.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <>
          <div className="space-y-3">
            {documents.map((d) => (
              <div key={d.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.reference} • {d.entityType} • {d.entityReference}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-500">{formatSize(d.fileSize)}</div>
                    <button onClick={async () => { if (confirm('Delete?')) { await api.deleteDocument(d.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
                {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-brand-600 hover:underline">View file</a>}
              </div>
            ))}
            {documents.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No documents.</div>}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-slate-600">Page {page}</span>
            <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={documents.length < pageSize}>
              Next
            </Button>
          </div>
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="New Document">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File Name *</label>
            <Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Entity Type</label>
              <Select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })}>
                <option value="lead">Lead</option>
                <option value="customer">Customer</option>
                <option value="invoice">Invoice</option>
                <option value="expense">Expense</option>
                <option value="task">Task</option>
                <option value="ticket">Ticket</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Entity Reference</label>
              <Input value={form.entityReference} onChange={(e) => setForm({ ...form, entityReference: e.target.value })} placeholder="L-0001" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File URL</label>
            <Input value={form.fileUrl ?? ''} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." />
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