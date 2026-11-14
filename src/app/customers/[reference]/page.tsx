'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/lead/CustomerForm';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Customer, CustomerInput, Person, BusinessBranch, BusinessCommunication } from '@/lib/types';
import { CUSTOMER_STATUS_LABELS } from '@/lib/types';

function CustomerDetailContent() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const toast = useToast();
  const ref = decodeURIComponent(params.reference);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [people, setPeople] = React.useState<Person[]>([]);
  const [branches, setBranches] = React.useState<BusinessBranch[]>([]);
  const [communications, setCommunications] = React.useState<BusinessCommunication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, b, com] = await Promise.all([api.getCustomer(ref), api.people(), api.listBranches(ref), api.listCommunications(ref)]);
      setCustomer(c.customer);
      setPeople(p.people);
      setBranches(b.branches);
      setCommunications(com.communications);
      setStatus(c.customer.status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [ref]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleStatusChange = async (newStatus: string) => {
    if (!customer) return;
    try {
      await api.updateCustomer(customer.reference, { status: newStatus });
      toast.add({ variant: 'success', title: `Status updated` });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update status', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleUpdate = async (input: CustomerInput) => {
    if (!customer) return;
    setSubmitting(true);
    try {
      await api.updateCustomer(customer.reference, input);
      setEditing(false);
      toast.add({ variant: 'success', title: 'Customer updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update customer', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!confirm('Delete this customer?')) return;
    try {
      await api.deleteCustomer(customer.reference);
      toast.add({ variant: 'success', title: 'Customer deleted' });
      router.push('/customers');
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete customer', description: e instanceof Error ? e.message : '' });
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-64" />
    </div>
  );
  if (!customer) return <div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Customer not found.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <PageHeader
        title={customer.name}
        description={`${customer.reference}${customer.city ? ` • ${customer.city}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
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
                <div><dt className="text-xs uppercase text-slate-500">Status</dt><dd className="mt-1 text-sm text-slate-700">{CUSTOMER_STATUS_LABELS[customer.status] ?? customer.status}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Category</dt><dd className="mt-1 text-sm text-slate-700">{customer.category || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">MRR</dt><dd className="mt-1 text-sm text-slate-700">${customer.mrr.toLocaleString()}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Total Value</dt><dd className="mt-1 text-sm text-slate-700">${customer.totalValue.toLocaleString()}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Assigned To</dt><dd className="mt-1 text-sm text-slate-700">{customer.assignedToName || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Team</dt><dd className="mt-1 text-sm text-slate-700">{customer.assignedTeam || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Lead Ref</dt><dd className="mt-1 text-sm text-slate-700">{customer.leadReference || '—'}</dd></div>
              </dl>
              {customer.notes && (
                <div className="mt-4">
                  <dt className="text-xs uppercase text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{customer.notes}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Branches</h2></CardHeader>
            <CardBody>
              <div className="space-y-2">
                {branches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{b.name}</div>
                      <div className="text-xs text-slate-500">{b.location || '—'} • {b.kind} • {b.status}</div>
                    </div>
                    {b.isPrimary && <span className="rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Primary</span>}
                  </div>
                ))}
                {branches.length === 0 && <div className="text-sm text-slate-400">No branches.</div>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Communications</h2></CardHeader>
            <CardBody>
              <div className="space-y-2">
                {communications.map((c) => (
                  <div key={c.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-900">{c.subject}</div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c.kind}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{c.contactName || '—'} • {new Date(c.createdAt).toLocaleDateString()}</div>
                    {c.body && <div className="mt-1 text-sm text-slate-600">{c.body}</div>}
                  </div>
                ))}
                {communications.length === 0 && <div className="text-sm text-slate-400">No communications.</div>}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Contact</h2></CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><dt className="text-xs uppercase text-slate-500">Name</dt><dd className="mt-1 text-sm text-slate-700">{customer.contactName || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Role</dt><dd className="mt-1 text-sm text-slate-700">{customer.contactRole || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Email</dt><dd className="mt-1 text-sm text-slate-700">{customer.contactEmail || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Phone</dt><dd className="mt-1 text-sm text-slate-700">{customer.contactPhone || '—'}</dd></div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Update Status</h2></CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-xs">
                  {Object.entries(CUSTOMER_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                <Button onClick={() => handleStatusChange(status)} disabled={status === customer.status}>Update Status</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Activity</h2></CardHeader>
            <CardBody>
              <ul className="space-y-3">
                {customer.activities.map((a) => (
                  <li key={a.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="text-sm font-medium text-slate-800">{a.summary}</div>
                    <div className="text-xs text-slate-500">{a.kind} · {new Date(a.createdAt).toLocaleString()}</div>
                  </li>
                ))}
                {customer.activities.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Customer">
        <CustomerForm initial={customer} people={people} submitting={submitting} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
      </Modal>
    </div>
  );
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Loading...</div>}>
      <CustomerDetailContent />
    </Suspense>
  );
}