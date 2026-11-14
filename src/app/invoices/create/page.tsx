'use client';
import * as React from 'react';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { Combobox } from '@/components/ui/Combobox';
import { api } from '@/lib/api';
import type { Customer, Product } from '@/lib/types';
import { customerToOption, productToOption } from '@/lib/combobox-helpers';
import { INVOICE_STATUS_LABELS } from '@/lib/types';

interface LineItem { productReference: string; description: string; quantity: number; unitPrice: number; discountPercent: number; taxRate: number; }

function CreateInvoiceContent() {
  const router = useRouter();
  const toast = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customerReference, setCustomerReference] = React.useState('');
  const [status, setStatus] = React.useState('draft');
  const [issueDate, setIssueDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = React.useState('USD');
  const [notes, setNotes] = React.useState('');
  const [terms, setTerms] = React.useState('');
  const [items, setItems] = React.useState<LineItem[]>([{ productReference: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 0 }]);
  const [submitting, setSubmitting] = React.useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => {
    api.listCustomers().then((r) => setCustomers(r.customers)).catch(console.error);
    api.listProducts().then((r) => setProducts(r.products)).catch(console.error);
  }, []);

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, { productReference: '', description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerReference) { toast.add({ variant: 'error', title: 'Select a customer' }); return; }
    setSubmitting(true);
    try {
      const { invoice } = await api.createInvoice({
        customerReference,
        status,
        issueDate,
        dueDate,
        currency,
        notes: notes || null,
        terms: terms || null,
        lineItems: items.filter((it) => it.description.trim()).map((it) => ({
          productReference: it.productReference || null,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxRate: it.taxRate,
        })),
      });
      toast.add({ variant: 'success', title: 'Invoice created' });
      router.push(`/invoices/${invoice.reference}`);
    } catch (e) {
      toast.add({ variant: 'error', title: 'Could not create invoice', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  const customerOptions = customers.map(customerToOption);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <PageHeader title="New Invoice" description="Create an invoice" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Combobox
              label="Customer"
              required
              options={customerOptions}
              value={customerReference}
              onChange={(v) => setCustomerReference(v)}
              placeholder="Search customer by name, phone, email, city..."
              recentKey="invoice-customer"
              allowCreate={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
              {Object.entries(INVOICE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Date</label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Line Items</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>+ Add Item</Button>
          </div>
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-md border border-slate-200 bg-white p-3">
                <Combobox
                  label="Product (optional)"
                  options={products.map(productToOption)}
                  value={it.productReference}
                  onChange={(v) => {
                    const prod = products.find((p) => p.reference === v);
                    if (prod) {
                      updateItem(idx, { productReference: prod.reference, description: prod.name, unitPrice: prod.price });
                    } else {
                      updateItem(idx, { productReference: '' });
                    }
                  }}
                  placeholder="Search product by name, SKU, price..."
                  allowCreate={false}
                />
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  </div>
                  <Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                  <Input type="number" placeholder="Unit Price" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })} />
                  <Input type="number" placeholder="Tax %" value={it.taxRate} onChange={(e) => updateItem(idx, { taxRate: Number(e.target.value) })} />
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="mt-2 text-xs text-rose-600 hover:underline">Remove</button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-sm font-medium text-slate-700">Subtotal: ${subtotal.toLocaleString()}</div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Terms</label>
          <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}
export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-6 text-slate-500">Loading...</div>}>
      <CreateInvoiceContent />
    </Suspense>
  );
}
