import db from './db';
import type { Invoice, InvoiceInput, InvoiceLineItem, InvoiceSummary } from '@/lib/types';

interface InvoiceRow {
  id: number;
  reference: string;
  customer_reference: string;
  customer_name: string;
  lead_reference: string | null;
  proposal_reference: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
}

interface LineRow {
  id: number;
  invoice_reference: string;
  product_reference: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateLine(r: LineRow): InvoiceLineItem {
  return {
    id: r.id,
    invoiceReference: r.invoice_reference,
    productReference: r.product_reference,
    description: r.description,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    discountPercent: r.discount_percent,
    discountAmount: r.discount_amount,
    taxRate: r.tax_rate,
    taxAmount: r.tax_amount,
    lineTotal: r.line_total,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function loadLines(ref: string): InvoiceLineItem[] {
  const rows = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_reference = ? ORDER BY sort_order, id').all(ref) as LineRow[];
  return rows.map(hydrateLine);
}

function hydrate(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    reference: row.reference,
    customerReference: row.customer_reference,
    customerName: row.customer_name,
    leadReference: row.lead_reference,
    proposalReference: row.proposal_reference,
    status: row.status,
    subtotal: row.subtotal,
    taxAmount: row.tax_amount,
    discountAmount: row.discount_amount,
    totalAmount: row.total_amount,
    currency: row.currency,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    notes: row.notes,
    terms: row.terms,
    lineItems: loadLines(row.reference),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listInvoices(filters: { search?: string; status?: string; customerReference?: string; limit?: number; page?: number } = {}): Invoice[] {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conditions.push('(i.reference LIKE ? OR i.customer_name LIKE ? OR i.customer_reference LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.status) { conditions.push('i.status = ?'); params.push(filters.status); }
  if (filters.customerReference) { conditions.push('i.customer_reference = ?'); params.push(filters.customerReference); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM invoices i ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as InvoiceRow[];
  return rows.map(hydrate);
}

export function getInvoiceByIdOrRef(idOrRef: string): Invoice | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT * FROM invoices WHERE id = ?').get(Number(idOrRef))
    : db.prepare('SELECT * FROM invoices WHERE reference = ?').get(idOrRef)) as InvoiceRow | undefined;
  if (!row) return null;
  return hydrate(row);
}

export function createInvoice(input: InvoiceInput): Invoice {
  const ts = now();
  const issueDate = input.issueDate || ts.slice(0, 10);
  const dueDate = input.dueDate || ts.slice(0, 10);
  let subtotal = input.subtotal ?? 0;
  let taxAmount = input.taxAmount ?? 0;
  let discountAmount = input.discountAmount ?? 0;
  const lines = input.lineItems ?? [];
  if (input.subtotal === undefined && lines.length) {
    subtotal = lines.reduce((s, li) => s + (li.quantity ?? 1) * (li.unitPrice ?? 0), 0);
  }
  if (input.taxAmount === undefined && lines.length) {
    taxAmount = lines.reduce((s, li) => {
      const q = li.quantity ?? 1; const p = li.unitPrice ?? 0; const d = (li.discountPercent ?? 0) / 100;
      const base = q * p * (1 - d);
      return s + base * ((li.taxRate ?? 0) / 100);
    }, 0);
  }
  if (input.discountAmount === undefined && lines.length) {
    discountAmount = lines.reduce((s, li) => s + (li.quantity ?? 1) * (li.unitPrice ?? 0) * ((li.discountPercent ?? 0) / 100), 0);
  }
  const totalAmount = input.totalAmount ?? subtotal + taxAmount - discountAmount;

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO invoices (reference, customer_reference, customer_name, lead_reference, proposal_reference, status,
        subtotal, tax_amount, discount_amount, total_amount, currency, issue_date, due_date, paid_date, notes, terms, created_at, updated_at)
      VALUES (@reference, @customer_reference, @customer_name, @lead_reference, @proposal_reference, @status,
        @subtotal, @tax_amount, @discount_amount, @total_amount, @currency, @issue_date, @due_date, @paid_date, @notes, @terms, @created_at, @updated_at)
    `).run({
      reference: 'tmp',
      customer_reference: input.customerReference,
      customer_name: input.customerReference,
      lead_reference: input.leadReference ?? null,
      proposal_reference: input.proposalReference ?? null,
      status: input.status ?? 'draft',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      currency: input.currency ?? 'USD',
      issue_date: issueDate,
      due_date: dueDate,
      paid_date: input.paidDate ?? null,
      notes: input.notes ?? null,
      terms: input.terms ?? null,
      created_at: ts,
      updated_at: ts,
    });
    const id = Number(info.lastInsertRowid);
    const reference = `INV-${String(id).padStart(4, '0')}`;
    db.prepare('UPDATE invoices SET reference = ?, customer_name = ? WHERE id = ?').run(reference, input.customerReference, id);
    // Actually set customer_name from customers table if possible
    const cust = db.prepare('SELECT name FROM customers WHERE reference = ?').get(input.customerReference) as { name: string } | undefined;
    if (cust) db.prepare('UPDATE invoices SET customer_name = ? WHERE id = ?').run(cust.name, id);

    // line items
    const lines = input.lineItems ?? [];
    lines.forEach((li, idx) => {
      const qty = li.quantity ?? 1;
      const price = li.unitPrice ?? 0;
      const discPct = li.discountPercent ?? 0;
      const taxRate = li.taxRate ?? 0;
      const lineSubtotal = qty * price;
      const discAmt = lineSubtotal * (discPct / 100);
      const taxable = lineSubtotal - discAmt;
      const taxAmt = taxable * (taxRate / 100);
      const lineTotal = taxable + taxAmt;
      db.prepare(`
        INSERT INTO invoice_line_items (invoice_reference, product_reference, description, quantity, unit_price, discount_percent, discount_amount, tax_rate, tax_amount, line_total, sort_order, created_at, updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(reference, (li as Record<string,unknown>).productReference ?? null, li.description, qty, price, discPct, discAmt, taxRate, taxAmt, lineTotal, idx, ts, ts);
    });

    return id;
  });
  const id = tx();
  const inv = getInvoiceByIdOrRef(String(id));
  if (!inv) throw new Error('Failed to create invoice');
  return inv;
}

export function updateInvoice(idOrRef: string, patch: Partial<InvoiceInput> & { status?: string }): Invoice {
  const existing = getInvoiceByIdOrRef(idOrRef);
  if (!existing) throw new Error('Invoice not found');
  const id = existing.id;
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  const map: Record<string, string> = {
    customerReference: 'customer_reference',
    status: 'status',
    subtotal: 'subtotal',
    taxAmount: 'tax_amount',
    discountAmount: 'discount_amount',
    totalAmount: 'total_amount',
    currency: 'currency',
    issueDate: 'issue_date',
    dueDate: 'due_date',
    paidDate: 'paid_date',
    notes: 'notes',
    terms: 'terms',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'leadReference')) {
    fields.push('lead_reference = @lead_reference');
    params.lead_reference = patch.leadReference ?? null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'customerReference')) {
    const cust = db.prepare('SELECT name FROM customers WHERE reference = ?').get(patch.customerReference) as { name: string } | undefined;
    if (cust) { fields.push('customer_name = @customer_name'); params.customer_name = cust.name; }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status === 'paid' && !existing.paidDate) {
    fields.push('paid_date = @paid_date');
    params.paid_date = now().slice(0, 10);
  }
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getInvoiceByIdOrRef(String(id));
  if (!updated) throw new Error('Failed to update invoice');
  return updated;
}

export function deleteInvoice(idOrRef: string): void {
  const existing = getInvoiceByIdOrRef(idOrRef);
  if (!existing) throw new Error('Invoice not found');
  db.prepare('DELETE FROM invoices WHERE id = ?').run(existing.id);
}

export function invoiceSummary(): InvoiceSummary {
  const total = (db.prepare('SELECT COUNT(*) c FROM invoices').get() as { c: number }).c;
  const draft = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='draft'").get() as { c: number }).c;
  const sent = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='sent'").get() as { c: number }).c;
  const paid = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='paid'").get() as { c: number }).c;
  const overdue = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='overdue'").get() as { c: number }).c;
  const cancelled = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='cancelled'").get() as { c: number }).c;
  const voidc = (db.prepare("SELECT COUNT(*) c FROM invoices WHERE status='void'").get() as { c: number }).c;
  const totalAmount = (db.prepare('SELECT COALESCE(SUM(total_amount),0) v FROM invoices').get() as { v: number }).v;
  const paidAmount = (db.prepare("SELECT COALESCE(SUM(total_amount),0) v FROM invoices WHERE status='paid'").get() as { v: number }).v;
  const outstanding = (db.prepare("SELECT COALESCE(SUM(total_amount),0) v FROM invoices WHERE status IN ('sent','overdue')").get() as { v: number }).v;
  return {
    total, draft, sent, paid, overdue, cancelled, void: voidc,
    totalAmount, paidAmount, outstandingAmount: outstanding,
  };
}