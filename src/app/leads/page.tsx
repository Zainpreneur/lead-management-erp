'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LeadCard } from '@/components/lead/LeadCard';
import { LeadBoard } from '@/components/lead/LeadBoard';
import { LeadForm } from '@/components/lead/LeadForm';
import { ViewSwitcher } from '@/components/views/ViewSwitcher';
import { CalendarView } from '@/components/views/CalendarView';
import { TimelineView } from '@/components/views/TimelineView';
import { GanttView } from '@/components/views/GanttView';
import { MapView } from '@/components/views/MapView';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { Lead, LeadInput, ListFilters, Person } from '@/lib/types';
import { STAGE_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '@/lib/types';

const VIEW_OPTIONS = [
  { value: 'card', label: 'Cards' },
  { value: 'list', label: 'List' },
  { value: 'board', label: 'Board' },
];

export default function LeadsPage() {
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = React.useState<'card' | 'list' | 'board' | 'calendar' | 'timeline' | 'gantt' | 'map'>('card');
  const [filters, setFilters] = React.useState<ListFilters>({});
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState('');
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Lead | null>(null);
  const [deleting, setDeleting] = React.useState<Lead | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([
        api.listLeads({ ...filters, search: searchInput || undefined, limit: pageSize, page }),
        api.people(),
      ]);
      setLeads(l.leads);
      setPeople(p.people);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, searchInput, page]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleCreate = async (input: LeadInput) => {
    setSubmitting(true);
    try {
      await api.createLead(input);
      setCreating(false);
      toast.add({ variant: 'success', title: 'Lead created' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create lead', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (input: LeadInput) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.updateLead(editing.reference, input);
      setEditing(null);
      toast.add({ variant: 'success', title: 'Lead updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update lead', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.deleteLead(deleting.reference);
      setDeleting(null);
      toast.add({ variant: 'success', title: 'Lead deleted' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete lead', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleConvert = async (lead: Lead) => {
    try {
      const { customer } = await api.convertLead(lead.reference);
      toast.add({ variant: 'success', title: 'Converted to customer' });
      router.push(`/customers/${customer.reference}`);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not convert lead', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleMove = async (lead: Lead, stage: string) => {
    try {
      await api.updateLead(lead.reference, { stage });
      toast.add({ variant: 'success', title: `Moved to ${stage}` });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not move lead', description: e instanceof Error ? e.message : '' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6">
      {/* Compact sticky header */}
      <div className="sticky top-14 z-30 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">Leads</span>
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">{leads.length}</span>
          </div>
          <Button size="sm" onClick={() => setCreating(true)}>+ New</Button>
        </div>
      </div>

      {/* Search + filter + view switcher */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search leads..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 flex-1"
          />
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen((v) => !v)} className="shrink-0">
            Filter
            {([filters.stage, filters.priority, filters.source].filter(Boolean).length > 0) && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {[filters.stage, filters.priority, filters.source].filter(Boolean).length}
              </span>
            )}
          </Button>
          <ViewSwitcher
            views={['card', 'list', 'board', 'calendar', 'timeline', 'gantt', 'map']}
            current={view}
            onChange={(v) => setView(v as 'card' | 'list' | 'board' | 'calendar' | 'timeline' | 'gantt' | 'map')}
          />
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl bg-white p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Filters</h3>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Stage</label>
                  <Select value={filters.stage || ''} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value || undefined }))}>
                    <option value="">Every stage</option>
                    {Object.entries(STAGE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Priority</label>
                  <Select value={filters.priority || ''} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value || undefined }))}>
                    <option value="">All priorities</option>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Source</label>
                  <Select value={filters.source || ''} onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value || undefined }))}>
                    <option value="">All sources</option>
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => { setFilters({}); setFiltersOpen(false); }}>Clear</Button>
                <Button className="flex-1" onClick={() => setFiltersOpen(false)}>Apply</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          {view === 'card' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onView={() => router.push(`/leads/${lead.reference}`)} onEdit={() => setEditing(lead)} onDelete={() => setDeleting(lead)} onConvert={() => handleConvert(lead)} />
              ))}
              {leads.length === 0 && (
                <div className="col-span-full rounded-md border border-dashed border-slate-300 bg-white py-12 text-center">
                  <div className="text-lg font-medium text-slate-700">No leads found</div>
                  <p className="mt-1 text-sm text-slate-500">Try adjusting filters or create a new lead.</p>
                  <div className="mt-4">
                    <Button onClick={() => setCreating(true)}>+ New Lead</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'list' && (
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Stage</th>
                      <th className="px-4 py-2">Priority</th>
                      <th className="px-4 py-2">Value</th>
                      <th className="px-4 py-2">City</th>
                      <th className="px-4 py-2">Assigned</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-t border-slate-100">
                        <td className="px-4 py-2">
                          <a href={`/leads/${lead.reference}`} className="font-medium text-slate-900 hover:text-brand-600">{lead.name}</a>
                          <div className="text-xs text-slate-400">{lead.reference}</div>
                        </td>
                        <td className="px-4 py-2"><Badge tone={lead.stage}>{STAGE_LABELS[lead.stage]}</Badge></td>
                        <td className="px-4 py-2"><Badge tone={lead.priority}>{PRIORITY_LABELS[lead.priority]}</Badge></td>
                        <td className="px-4 py-2">${lead.estimatedValue.toLocaleString()}</td>
                        <td className="px-4 py-2">{lead.city || '—'}</td>
                        <td className="px-4 py-2">{lead.assignedToName || '—'}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => setEditing(lead)} className="text-xs text-brand-600 hover:underline">Edit</button>
                            <button onClick={() => setDeleting(lead)} className="text-xs text-rose-600 hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No leads found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {view === 'board' && (
            <LeadBoard leads={leads} onMove={handleMove} />
          )}

          {view === 'calendar' && (
            <CalendarView
              events={leads.map((l) => ({
                id: l.id,
                title: l.name,
                date: l.followUpDate || l.createdAt,
                color: l.priority === 'hot' ? 'bg-rose-500' : l.priority === 'warm' ? 'bg-amber-500' : 'bg-sky-500',
                url: `/leads/${l.reference}`,
              }))}
              onEventClick={(e) => router.push(`/leads/${e.id}`)}
            />
          )}

          {view === 'timeline' && (
            <TimelineView
              items={leads.flatMap((l) => [
                { id: `${l.id}-created`, title: `Lead created: ${l.name}`, date: l.createdAt, type: 'created' as const },
                ...l.activities.map((a) => ({ id: `${l.id}-${a.id}`, title: a.summary, date: a.createdAt, type: (a.kind === 'stage_change' ? 'status_change' : 'comment') as 'status_change' | 'comment', description: a.outcome || undefined, actor: a.actor })),
              ])}
            />
          )}

          {view === 'gantt' && (
            <GanttView
              items={leads.map((l) => ({
                id: l.id,
                title: l.name,
                startDate: l.createdAt.split('T')[0],
                endDate: (l.followUpDate || new Date(new Date(l.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
                progress: l.stage === 'won' ? 100 : l.stage === 'lost' ? 0 : 50,
                color: l.priority === 'hot' ? 'bg-rose-500' : l.priority === 'warm' ? 'bg-amber-500' : 'bg-sky-500',
                assignee: l.assignedToName || undefined,
              }))}
            />
          )}

          {view === 'map' && (
            <MapView
              items={leads.map((l) => ({
                id: l.id,
                title: l.name,
                location: l.city ? `${l.city}, ${l.country || ''}`.trim() : 'Unknown',
              }))}
            />
          )}
        </>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page}
        </span>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setPage(p => p + 1)}
          disabled={leads.length < pageSize}
        >
          Next
        </Button>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New Lead">
        <LeadForm people={people} submitting={submitting} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Lead">
        {editing && (
          <LeadForm initial={editing} people={people} submitting={submitting} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Lead">
        <p className="text-sm text-slate-600">Delete {deleting?.name}? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

    </div>
  );
}