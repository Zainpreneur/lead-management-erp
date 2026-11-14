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
import type { QualityInspection, QualityInspectionInput, NonConformanceReport, NCRInput, Product, Vendor } from '@/lib/types';
import { productToOption, vendorToOption } from '@/lib/combobox-helpers';
import { INSPECTION_TYPE_LABELS, INSPECTION_STATUS_LABELS, NCR_SEVERITY_LABELS, NCR_STATUS_LABELS } from '@/lib/types';

export default function QualityPage() {
  const toast = useToast();
  const [inspections, setInspections] = React.useState<QualityInspection[]>([]);
  const [ncrs, setNcrs] = React.useState<NonConformanceReport[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creatingInspection, setCreatingInspection] = React.useState(false);
  const [creatingNCR, setCreatingNCR] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [inspectionForm, setInspectionForm] = React.useState<QualityInspectionInput>({ title: '', type: 'incoming', status: 'pending', inspectionDate: new Date().toISOString().slice(0, 10) });
  const [ncrForm, setNcrForm] = React.useState<NCRInput>({ title: '', description: '', severity: 'minor', status: 'open' });

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [ins, ncr, p, v] = await Promise.all([
        api.listQualityInspections({ limit: pageSize, page }),
        api.listNCRs({ limit: pageSize, page }),
        api.listProducts(),
        api.listVendors(),
      ]);
      setInspections(ins.inspections);
      setNcrs(ncr.ncrs);
      setProducts(p.products);
      setVendors(v.vendors);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createQualityInspection(inspectionForm);
      setCreatingInspection(false);
      toast.add({ variant: 'success', title: 'Inspection created' });
      setInspectionForm({ title: '', type: 'incoming', status: 'pending', inspectionDate: new Date().toISOString().slice(0, 10) });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create inspection', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handleCreateNCR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createNCR(ncrForm);
      setCreatingNCR(false);
      toast.add({ variant: 'success', title: 'NCR created' });
      setNcrForm({ title: '', description: '', severity: 'minor', status: 'open' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create NCR', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const productOptions = products.map(productToOption);
  const vendorOptions = vendors.map(vendorToOption);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Quality Management</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setCreatingNCR(true)}>+ NCR</Button>
            <Button size="sm" onClick={() => setCreatingInspection(true)}>+ Inspection</Button>
          </div>
        </div>
      </div>

      {/* Inspections */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Quality Inspections</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <>
            <div className="space-y-3">
              {inspections.map((ins) => (
                <div key={ins.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{ins.title}</div>
                      <div className="text-xs text-slate-500">{ins.reference} • {INSPECTION_TYPE_LABELS[ins.type] ?? ins.type} • {INSPECTION_STATUS_LABELS[ins.status] ?? ins.status}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${ins.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : ins.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {ins.result || ins.status}
                      </span>
                      <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteQualityInspection(ins.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  {ins.notes && <p className="mt-2 text-sm text-slate-600">{ins.notes}</p>}
                </div>
              ))}
              {inspections.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No inspections.</div>}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-600">Page {page}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={inspections.length < pageSize}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      {/* NCRs */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Non-Conformance Reports</h2>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <>
            <div className="space-y-3">
              {ncrs.map((ncr) => (
                <div key={ncr.id} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{ncr.title}</div>
                      <div className="text-xs text-slate-500">{ncr.reference} • {NCR_SEVERITY_LABELS[ncr.severity] ?? ncr.severity} • {NCR_STATUS_LABELS[ncr.status] ?? ncr.status}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${ncr.severity === 'critical' ? 'bg-rose-100 text-rose-700' : ncr.severity === 'major' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {ncr.severity}
                      </span>
                      <button onClick={async () => { if (confirm(`Delete?`)) { await api.deleteNCR(ncr.reference); toast.add({ variant: 'success', title: 'Deleted' }); load(); } }} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{ncr.description}</p>
                  {ncr.resolution && <p className="mt-1 text-xs text-emerald-600">Resolution: {ncr.resolution}</p>}
                </div>
              ))}
              {ncrs.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No NCRs.</div>}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-slate-600">Page {page}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={ncrs.length < pageSize}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create Inspection Modal */}
      <Modal open={creatingInspection} onClose={() => setCreatingInspection(false)} title="New Quality Inspection">
        <form onSubmit={handleCreateInspection} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={inspectionForm.title ?? ''} onChange={(e) => setInspectionForm({ ...inspectionForm, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select value={inspectionForm.type ?? 'incoming'} onChange={(e) => setInspectionForm({ ...inspectionForm, type: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(INSPECTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={inspectionForm.status ?? 'pending'} onChange={(e) => setInspectionForm({ ...inspectionForm, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(INSPECTION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Combobox
                label="Product"
                options={productOptions}
                value={inspectionForm.productReference ?? ''}
                onChange={(v) => setInspectionForm({ ...inspectionForm, productReference: v || null })}
                placeholder="Search product by name, SKU, price..."
                recentKey="quality-inspection-product"
                allowCreate={false}
              />
            </div>
            <div>
              <Combobox
                label="Vendor"
                options={vendorOptions}
                value={inspectionForm.vendorReference ?? ''}
                onChange={(v) => setInspectionForm({ ...inspectionForm, vendorReference: v || null })}
                placeholder="Search vendor by name, phone, email, city..."
                recentKey="quality-inspection-vendor"
                allowCreate={false}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Inspection Date</label>
              <Input type="date" value={inspectionForm.inspectionDate ?? ''} onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionDate: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Inspector</label>
              <Input value={inspectionForm.inspector ?? ''} onChange={(e) => setInspectionForm({ ...inspectionForm, inspector: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Result</label>
            <Input value={inspectionForm.result ?? ''} onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={inspectionForm.notes ?? ''} onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreatingInspection(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Create NCR Modal */}
      <Modal open={creatingNCR} onClose={() => setCreatingNCR(false)} title="New Non-Conformance Report">
        <form onSubmit={handleCreateNCR} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={ncrForm.title ?? ''} onChange={(e) => setNcrForm({ ...ncrForm, title: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
            <Textarea value={ncrForm.description ?? ''} onChange={(e) => setNcrForm({ ...ncrForm, description: e.target.value })} rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Severity</label>
              <select value={ncrForm.severity ?? 'minor'} onChange={(e) => setNcrForm({ ...ncrForm, severity: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(NCR_SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={ncrForm.status ?? 'open'} onChange={(e) => setNcrForm({ ...ncrForm, status: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                {Object.entries(NCR_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <Combobox
                label="Product"
                options={productOptions}
                value={ncrForm.productReference ?? ''}
                onChange={(v) => setNcrForm({ ...ncrForm, productReference: v || null })}
                placeholder="Search product by name, SKU, price..."
                recentKey="quality-ncr-product"
                allowCreate={false}
              />
            </div>
            <div>
              <Combobox
                label="Vendor"
                options={vendorOptions}
                value={ncrForm.vendorReference ?? ''}
                onChange={(v) => setNcrForm({ ...ncrForm, vendorReference: v || null })}
                placeholder="Search vendor by name, phone, email, city..."
                recentKey="quality-ncr-vendor"
                allowCreate={false}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resolution</label>
            <Textarea value={ncrForm.resolution ?? ''} onChange={(e) => setNcrForm({ ...ncrForm, resolution: e.target.value })} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreatingNCR(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
