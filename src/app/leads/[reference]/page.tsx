'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { LeadForm } from '@/components/lead/LeadForm';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import type { Lead, LeadInput, Person } from '@/lib/types';
import { STAGE_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '@/lib/types';

function LeadDetailContent() {
  const params = useParams<{ reference: string }>();
  const toast = useToast();
  const router = useRouter();
  const ref = decodeURIComponent(params.reference);
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [stage, setStage] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [l, p] = await Promise.all([api.getLead(ref), api.people()]);
      setLead(l.lead);
      setPeople(p.people);
      setStage(l.lead.stage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ref]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleStageChange = async (newStage: string) => {
    if (!lead) return;
    try {
      await api.updateLead(lead.reference, { stage: newStage });
      toast.add({ variant: 'success', title: `Moved to ${newStage}` });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update stage', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleUpdate = async (input: LeadInput) => {
    if (!lead) return;
    setSubmitting(true);
    try {
      await api.updateLead(lead.reference, input);
      setEditing(false);
      toast.add({ variant: 'success', title: 'Lead updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update lead', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    try {
      const { customer } = await api.convertLead(lead.reference);
      toast.add({ variant: 'success', title: 'Converted to customer' });
      router.push(`/customers/${customer.reference}`);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not convert lead', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    if (!confirm('Delete this lead?')) return;
    try {
      await api.deleteLead(lead.reference);
      toast.add({ variant: 'success', title: 'Lead deleted' });
      router.push('/leads');
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete lead', description: e instanceof Error ? e.message : '' });
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
  if (!lead) return <div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Lead not found.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <PageHeader
        title={lead.name}
        description={`${lead.reference} · ${lead.city || ''} ${lead.country || ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button onClick={handleConvert}>Convert to Customer</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Details</h2></CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><dt className="text-xs uppercase text-slate-500">Stage</dt><dd className="mt-1"><Badge tone={lead.stage}>{STAGE_LABELS[lead.stage]}</Badge></dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Priority</dt><dd className="mt-1"><Badge tone={lead.priority}>{PRIORITY_LABELS[lead.priority]}</Badge></dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Source</dt><dd className="mt-1 text-sm text-slate-700">{SOURCE_LABELS[lead.source] ?? lead.source}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Category</dt><dd className="mt-1 text-sm text-slate-700">{lead.category || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Estimated Value</dt><dd className="mt-1 text-sm text-slate-700">${lead.estimatedValue.toLocaleString()}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Score</dt><dd className="mt-1 text-sm text-slate-700">{lead.score}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Assigned To</dt><dd className="mt-1 text-sm text-slate-700">{lead.assignedToName || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Team</dt><dd className="mt-1 text-sm text-slate-700">{lead.assignedTeam || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Follow-up</dt><dd className="mt-1 text-sm text-slate-700">{lead.followUpDate || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Reminder</dt><dd className="mt-1 text-sm text-slate-700">{lead.reminderDays} days</dd></div>
              </dl>
              {lead.notes && (
                <div className="mt-4">
                  <dt className="text-xs uppercase text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Contact</h2></CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><dt className="text-xs uppercase text-slate-500">Name</dt><dd className="mt-1 text-sm text-slate-700">{lead.contactName || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Role</dt><dd className="mt-1 text-sm text-slate-700">{lead.contactRole || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Email</dt><dd className="mt-1 text-sm text-slate-700">{lead.contactEmail || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Phone</dt><dd className="mt-1 text-sm text-slate-700">{lead.contactPhone || '—'}</dd></div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Move Stage</h2></CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={stage} onChange={(e) => setStage(e.target.value)} className="sm:max-w-xs">
                  {Object.entries(STAGE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                <Button onClick={() => handleStageChange(stage)} disabled={stage === lead.stage}>Update Stage</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Activity</h2></CardHeader>
            <CardBody>
              <ul className="space-y-3">
                {lead.activities.map((a) => (
                  <li key={a.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="text-sm font-medium text-slate-800">{a.summary}</div>
                    <div className="text-xs text-slate-500">{a.kind} · {new Date(a.createdAt).toLocaleString()}</div>
                  </li>
                ))}
                {lead.activities.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Lead">
        <LeadForm initial={lead} people={people} submitting={submitting} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}
export default function LeadDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Loading...</div>}>
      <LeadDetailContent />
    </Suspense>
  );
}
