'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import type { Invoice } from '@/lib/types';
import { INVOICE_STATUS_LABELS } from '@/lib/types';
import { Money } from '@/components/layout/Money';

function InvoiceDetailContent() {
  const params = useParams<{ reference: string }>();
  const router = useRouter();
  const toast = useToast();
  const ref = decodeURIComponent(params.reference);
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [editStatus, setEditStatus] = React.useState('');
  const [editIssueDate, setEditIssueDate] = React.useState('');
  const [editDueDate, setEditDueDate] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [editTerms, setEditTerms] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getInvoice(ref);
      setInvoice(res.invoice);
      setStatus(res.invoice.status);
      setEditStatus(res.invoice.status);
      setEditIssueDate(res.invoice.issueDate);
      setEditDueDate(res.invoice.dueDate);
      setEditNotes(res.invoice.notes ?? '');
      setEditTerms(res.invoice.terms ?? '');
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

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    try {
      await api.updateInvoice(invoice.reference, { status: newStatus });
      toast.add({ variant: 'success', title: 'Status updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update status', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    try {
      await api.updateInvoice(invoice.reference, {
        status: editStatus,
        issueDate: editIssueDate,
        dueDate: editDueDate,
        notes: editNotes || null,
        terms: editTerms || null,
      });
      setEditing(false);
      toast.add({ variant: 'success', title: 'Invoice updated' });
      await load();
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not update invoice', description: e instanceof Error ? e.message : '' });
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (!confirm('Delete this invoice?')) return;
    try {
      await api.deleteInvoice(invoice.reference);
      toast.add({ variant: 'success', title: 'Invoice deleted' });
      router.push('/invoices');
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not delete invoice', description: e instanceof Error ? e.message : '' });
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="h-64" />
    </div>
  );
  if (!invoice) return <div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Invoice not found.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <PageHeader
        title={invoice.reference}
        description={invoice.customerName}
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
                <div><dt className="text-xs uppercase text-slate-500">Status</dt><dd className="mt-1"><Badge tone={invoice.status === 'paid' ? 'won' : invoice.status === 'overdue' ? 'lost' : 'quoted'}>{INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}</Badge></dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Customer</dt><dd className="mt-1 text-sm text-slate-700">{invoice.customerName}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Issue Date</dt><dd className="mt-1 text-sm text-slate-700">{invoice.issueDate}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Due Date</dt><dd className="mt-1 text-sm text-slate-700">{invoice.dueDate}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Paid Date</dt><dd className="mt-1 text-sm text-slate-700">{invoice.paidDate || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Currency</dt><dd className="mt-1 text-sm text-slate-700">{invoice.currency}</dd></div>
              </dl>
              {invoice.notes && (
                <div className="mt-4">
                  <dt className="text-xs uppercase text-slate-500">Notes</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{invoice.notes}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Line Items</h2></CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((li) => (
                      <tr key={li.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{li.description}</td>
                        <td className="px-3 py-2">{li.quantity}</td>
                        <td className="px-3 py-2">${li.unitPrice.toLocaleString()}</td>
                        <td className="px-3 py-2">${li.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                    {invoice.lineItems.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No line items.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${invoice.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tax</span><span>${invoice.taxAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Discount</span><span>-${invoice.discountAmount.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span><Money value={invoice.totalAmount} /></span></div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Update Status</h2></CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:max-w-xs">
                  {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
                <Button onClick={() => handleStatusChange(status)} disabled={status === invoice.status}>Update Status</Button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><h2 className="font-semibold text-slate-800">Terms</h2></CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{invoice.terms || '—'}</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Invoice">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Issue Date</label>
              <Input type="date" value={editIssueDate} onChange={(e) => setEditIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Terms</label>
            <Textarea value={editTerms} onChange={(e) => setEditTerms(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-6 text-slate-500">Loading...</div>}>
      <InvoiceDetailContent />
    </Suspense>
  );
}