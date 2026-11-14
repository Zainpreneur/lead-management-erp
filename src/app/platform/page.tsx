'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { ImportJob } from '@/lib/types';
import { IMPORT_STATUS_LABELS } from '@/lib/types';

export default function PlatformPage() {
  const toast = useToast();
  const [importJobs, setImportJobs] = React.useState<ImportJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creatingImport, setCreatingImport] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [importForm, setImportForm] = React.useState({ entityType: 'leads', fileName: '', csv: '' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const j = await api.listImportJobs();
      setImportJobs(j.jobs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreateImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createImportJob(importForm);
      setCreatingImport(false);
      toast.add({ variant: 'success', title: `Imported ${res.result.processed} records` });
      setImportForm({ entityType: 'leads', fileName: '', csv: '' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not import', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleExport = (entity: string) => {
    window.open(api.exportData(entity), '_blank');
    toast.add({ variant: 'success', title: `Exporting ${entity}...` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Platform & Settings</span>
        </div>
      </div>

      {/* Export Section */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Export Data</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['leads', 'customers', 'invoices', 'expenses'].map((entity) => (
            <div key={entity} className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleExport(entity)}>
                CSV
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.open(`/api/export-xlsx?entity=${entity}`, '_blank')}>
                XLSX
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Import Jobs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Import Jobs</h2>
          <Button size="sm" onClick={() => setCreatingImport(true)}>+ Import</Button>
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="space-y-3">
            {importJobs.map((j) => (
              <div key={j.id} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{j.fileName}</div>
                    <div className="text-xs text-slate-500">{j.reference} • {j.entityType} • {IMPORT_STATUS_LABELS[j.status] ?? j.status}</div>
                  </div>
                  <div className="text-xs text-slate-500">{j.processedRows}/{j.totalRows} rows</div>
                </div>
                {j.errors && <div className="mt-1 text-xs text-rose-600">{j.errors}</div>}
              </div>
            ))}
            {importJobs.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No import jobs.</div>}
          </div>
        )}
      </div>

      <Modal open={creatingImport} onClose={() => setCreatingImport(false)} title="Import CSV">
        <form onSubmit={handleCreateImport} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Entity Type</label>
            <Select value={importForm.entityType} onChange={(e) => setImportForm({ ...importForm, entityType: e.target.value })}>
              <option value="leads">Leads</option>
              <option value="customers">Customers</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File Name</label>
            <Input value={importForm.fileName} onChange={(e) => setImportForm({ ...importForm, fileName: e.target.value })} placeholder="data.csv" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">CSV Content</label>
            <textarea
              value={importForm.csv}
              onChange={(e) => setImportForm({ ...importForm, csv: e.target.value })}
              rows={6}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              placeholder="name,city,source&#10;Acme Corp,New York,referral"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreatingImport(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Importing...' : 'Import'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}