'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { SourcingRequest, SourcingLine, Vendor, VendorQuote } from '@/lib/types';
import { vendorToOption } from '@/lib/combobox-helpers';
import { SOURCING_STATUS_LABELS, QUOTE_STATUS_LABELS } from '@/lib/types';

export default function SourcingPage() {
  const toast = useToast();
  const [requests, setRequests] = React.useState<SourcingRequest[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [form, setForm] = React.useState({ title: '', currency: 'USD', notes: '', lines: [{ title: '', description: '', quantity: 1, unit: 'unit' }] });

  const [detail, setDetail] = React.useState<SourcingRequest | null>(null);
  const [quotes, setQuotes] = React.useState<VendorQuote[]>([]);
  const [inviteVendorsSel, setInviteVendorsSel] = React.useState<string[]>([]);
  const [quoteForm, setQuoteForm] = React.useState<{ vendorReference: string; lines: Record<number, number> } | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [r, v] = await Promise.all([api.listSourcingRequests({ limit: pageSize, page }), api.listVendors({ limit: 100 })]);
      setRequests(r.requests);
      setVendors(v.vendors);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => { load(); }, [load]);

  const loadDetail = async (ref: string) => {
    try {
      const res = await api.getSourcingRequest(ref);
      setDetail(res.request);
      const q = await api.listVendorQuotes(res.request.id, res.request.round);
      setQuotes(q.quotes);
    } catch (e) { console.error(e); }
  };

  const updateLine = (idx: number, patch: Partial<{ title: string; description: string; quantity: number; unit: string }>) => {
    setForm((prev) => ({ ...prev, lines: prev.lines.map((li, i) => (i === idx ? { ...li, ...patch } : li)) }));
  };
  const addLine = () => setForm((prev) => ({ ...prev, lines: [...prev.lines, { title: '', description: '', quantity: 1, unit: 'unit' }] }));
  const removeLine = (idx: number) => setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSourcingRequest({ title: form.title, currency: form.currency, notes: form.notes || null, lines: form.lines.map((l) => ({ title: l.title, description: l.description || null, quantity: l.quantity, unit: l.unit })) });
      setCreating(false);
      toast.add({ variant: 'success', title: 'Sourcing request created' });
      setForm({ title: '', currency: 'USD', notes: '', lines: [{ title: '', description: '', quantity: 1, unit: 'unit' }] });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  const handlePublish = async (ref: string) => {
    try { await api.publishSourcingRequest(ref); toast.add({ variant: 'success', title: 'Published' }); await load(); if (detail?.reference === ref) await loadDetail(ref); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not publish', description: e instanceof Error ? e.message : '' }); }
  };
  const handleCancel = async (ref: string) => {
    if (!confirm('Cancel?')) return;
    try { await api.cancelSourcingRequest(ref); toast.add({ variant: 'success', title: 'Cancelled' }); await load(); if (detail?.reference === ref) setDetail(null); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not cancel', description: e instanceof Error ? e.message : '' }); }
  };
  const handleInvite = async (ref: string) => {
    if (inviteVendorsSel.length === 0) { toast.add({ variant: 'warning', title: 'Select vendors to invite' }); return; }
    try { await api.inviteVendors(ref, inviteVendorsSel, detail?.round); toast.add({ variant: 'success', title: 'Vendors invited' }); setInviteVendorsSel([]); await loadDetail(ref); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not invite', description: e instanceof Error ? e.message : '' }); }
  };
  const handleAwardLine = async (ref: string, lineId: number, vendorReference: string) => {
    try { await api.awardLine(ref, lineId, vendorReference); toast.add({ variant: 'success', title: 'Line awarded' }); await loadDetail(ref); await load(); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not award', description: e instanceof Error ? e.message : '' }); }
  };
  const handleAwardWhole = async (ref: string, vendorReference: string) => {
    try { await api.awardWhole(ref, vendorReference); toast.add({ variant: 'success', title: 'Awarded' }); await loadDetail(ref); await load(); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not award', description: e instanceof Error ? e.message : '' }); }
  };
  const handleNextRound = async (ref: string) => {
    try { await api.nextRound(ref, inviteVendorsSel.length ? inviteVendorsSel : undefined); toast.add({ variant: 'success', title: 'New round opened' }); setInviteVendorsSel([]); await loadDetail(ref); await load(); }
    catch (e) { toast.add({ variant: 'error', title: 'Could not open round', description: e instanceof Error ? e.message : '' }); }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm || !detail) return;
    setSubmitting(true);
    try {
      const lines = detail.lines.map((l) => ({ lineId: l.id, unitPrice: quoteForm.lines[l.id] ?? 0 }));
      await api.submitVendorQuote({ sourcingRequestId: detail.id, vendorReference: quoteForm.vendorReference, round: detail.round, lines });
      toast.add({ variant: 'success', title: 'Quote submitted' });
      setQuoteForm(null);
      await loadDetail(detail.reference);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not submit quote', description: e instanceof Error ? e.message : '' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-4 sm:px-6">
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Sourcing</span>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{r.title}</div>
                  <div className="text-xs text-slate-500">{r.reference} • {SOURCING_STATUS_LABELS[r.status] ?? r.status} • Round {r.round} • {r.lines.length} lines</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadDetail(r.reference)} className="text-xs text-brand-600 hover:underline">View</button>
                  {r.status === 'draft' && <button onClick={() => handlePublish(r.reference)} className="text-xs text-emerald-600 hover:underline">Publish</button>}
                  {r.status !== 'awarded' && r.status !== 'cancelled' && <button onClick={() => handleCancel(r.reference)} className="text-xs text-rose-600 hover:underline">Cancel</button>}
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && <div className="rounded-md border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">No sourcing requests.</div>}
        </div>
      )}

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New Sourcing Request">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Lines</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addLine}>+ Add</Button>
            </div>
            <div className="space-y-3">
              {form.lines.map((li, idx) => (
                <div key={idx} className="rounded-md border border-slate-200 bg-white p-3 space-y-2">
                  <Input placeholder="Title" value={li.title} onChange={(e) => updateLine(idx, { title: e.target.value })} />
                  <Input placeholder="Description" value={li.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Qty" value={li.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} />
                    <Input placeholder="Unit" value={li.unit} onChange={(e) => updateLine(idx, { unit: e.target.value })} />
                  </div>
                  {form.lines.length > 1 && <button type="button" onClick={() => removeLine(idx)} className="text-xs text-rose-600 hover:underline">Remove</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => { setDetail(null); setQuotes([]); }} title={detail?.title ?? ''}>
        {detail && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">{detail.reference} • {SOURCING_STATUS_LABELS[detail.status]} • Round {detail.round}</div>

            {/* Lines */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Lines</h3>
              <div className="space-y-2">
                {detail.lines.map((l) => (
                  <div key={l.id} className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{l.title} (×{l.quantity} {l.unit})</div>
                        {l.description && <div className="text-xs text-slate-500">{l.description}</div>}
                        {l.awardedVendorReference && <div className="text-xs text-emerald-600">Awarded to {l.awardedVendorReference}</div>}
                      </div>
                    </div>
                    {/* Award per line: pick from submitted quotes' vendors */}
                    {detail.status === 'published' && quotes.length > 0 && !l.awardedVendorReference && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quotes.map((q) => (
                          <button key={q.id} onClick={() => handleAwardLine(detail.reference, l.id, q.vendorReference)} className="text-xs text-brand-600 hover:underline">
                            Award to {q.vendorName || q.vendorReference} (${q.total.toLocaleString()})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Award whole */}
            {detail.status === 'published' && quotes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Award Whole Deliverable</h3>
                <div className="flex flex-wrap gap-2">
                  {quotes.map((q) => (
                    <button key={q.id} onClick={() => handleAwardWhole(detail.reference, q.vendorReference)} className="text-xs text-emerald-600 hover:underline">
                      Award all to {q.vendorName || q.vendorReference} (${q.total.toLocaleString()})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invites */}
            {detail.status === 'published' && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Invite Vendors</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {vendors.map((v) => (
                    <label key={v.id} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={inviteVendorsSel.includes(v.reference)} onChange={(e) => {
                        setInviteVendorsSel((prev) => e.target.checked ? [...prev, v.reference] : prev.filter((x) => x !== v.reference));
                      }} />
                      {v.name}
                    </label>
                  ))}
                </div>
                <Button size="sm" onClick={() => handleInvite(detail.reference)}>Invite Selected</Button>
              </div>
            )}

            {/* Quotes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Quotes (Round {detail.round})</h3>
              {quotes.length === 0 ? (
                <div className="text-xs text-slate-400">No quotes yet.</div>
              ) : (
                <div className="space-y-2">
                  {quotes.map((q) => (
                    <div key={q.id} className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900 text-sm">{q.vendorName || q.vendorReference}</div>
                          <div className="text-xs text-slate-500">{QUOTE_STATUS_LABELS[q.status] ?? q.status} • Total ${q.total.toLocaleString()}</div>
                        </div>
                      </div>
                      {q.lines.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.lines.map((ql) => {
                            const line = detail.lines.find((l) => l.id === ql.lineId);
                            return <div key={ql.id} className="text-xs text-slate-600">• {line?.title}: ${ql.unitPrice.toLocaleString()} × {line?.quantity} = ${ql.total.toLocaleString()}</div>;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit a quote (simulate vendor) */}
            {detail.status === 'published' && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Submit Quote (as vendor)</h3>
                {!quoteForm ? (
                  <Button size="sm" variant="secondary" onClick={() => setQuoteForm({ vendorReference: vendors[0]?.reference ?? '', lines: {} })}>+ New Quote</Button>
                ) : (
                  <form onSubmit={handleSubmitQuote} className="space-y-3">
                    <Combobox
                      label="Vendor"
                      options={vendors.map(vendorToOption)}
                      value={quoteForm.vendorReference}
                      onChange={(v) => setQuoteForm({ ...quoteForm, vendorReference: v })}
                      placeholder="Search vendor by name, phone, email, city..."
                      recentKey="sourcing-quote-vendor"
                      allowCreate={false}
                    />
                    {detail.lines.map((l) => (
                      <div key={l.id} className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 w-32 truncate">{l.title}</span>
                        <Input type="number" placeholder="Unit price" value={quoteForm.lines[l.id] ?? ''} onChange={(e) => setQuoteForm({ ...quoteForm, lines: { ...quoteForm.lines, [l.id]: Number(e.target.value) } })} />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setQuoteForm(null)}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Quote'}</Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Next round */}
            {detail.status === 'published' && (
              <div>
                <Button size="sm" variant="secondary" onClick={() => handleNextRound(detail.reference)}>Close Round & Open Next</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
