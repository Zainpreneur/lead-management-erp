'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { invoices, invoiceLineItems, customers } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceFiltersSchema,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceFilters,
  type InvoiceLineItemInput,
} from '@/lib/validations/invoices';
import { generateReference } from '@/lib/utils';

export async function listInvoices(filters: InvoiceFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'invoices:read')) {
    throw new Error('Unauthorized');
  }

  const validated = invoiceFiltersSchema.parse(filters);
  const { search, status, customerReference, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(invoices.reference, `%${search}%`),
      ilike(invoices.customerName, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(invoices.status, status));
  if (customerReference) conditions.push(eq(invoices.customerReference, customerReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: invoices.id,
        reference: invoices.reference,
        customerReference: invoices.customerReference,
        customerName: invoices.customerName,
        leadReference: invoices.leadReference,
        proposalReference: invoices.proposalReference,
        status: invoices.status,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        discountAmount: invoices.discountAmount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        notes: invoices.notes,
        terms: invoices.terms,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      })
      .from(invoices)
      .where(where)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(invoices).where(where),
  ]);

  return {
    invoices: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'invoices:read')) {
    throw new Error('Unauthorized');
  }

  const invoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.reference, reference))
    .limit(1);

  if (!invoice[0]) throw new Error('Invoice not found');

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceReference, reference))
    .orderBy(invoiceLineItems.sortOrder);

  return { invoice: { ...invoice[0], lineItems } };
}

export async function createInvoice(input: CreateInvoiceInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'invoices:write')) {
    throw new Error('Forbidden');
  }

  const validated = createInvoiceSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('INV');

  // Fetch customer name
  const customer = await db.select().from(customers).where(eq(customers.reference, validated.customerReference)).limit(1);
  if (!customer[0]) throw new Error('Customer not found');

  // Calculate totals if line items provided
  let subtotal = validated.subtotal || 0;
  let taxAmount = validated.taxAmount || 0;
  let discountAmount = validated.discountAmount || 0;
  let totalAmount = validated.totalAmount || 0;

  if (validated.lineItems && validated.lineItems.length > 0) {
    subtotal = validated.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    discountAmount = validated.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discountPercent / 100), 0);
    taxAmount = validated.lineItems.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      return sum + (lineSubtotal * item.taxRate / 100);
    }, 0);
    totalAmount = subtotal - discountAmount + taxAmount;
  }

  const [newInvoice] = await db
    .insert(invoices)
    .values({
      reference,
      customerReference: validated.customerReference,
      customerName: customer[0].name,
      leadReference: validated.leadReference,
      proposalReference: validated.proposalReference,
      status: validated.status,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      currency: validated.currency,
      issueDate: validated.issueDate,
      dueDate: validated.dueDate,
      paidDate: validated.paidDate,
      notes: validated.notes,
      terms: validated.terms,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Create line items
  if (validated.lineItems && validated.lineItems.length > 0) {
    const itemsToInsert = validated.lineItems.map((item, index) => ({
      invoiceReference: reference,
      productReference: item.productReference,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      discountAmount: item.quantity * item.unitPrice * item.discountPercent / 100,
      taxRate: item.taxRate,
      taxAmount: item.quantity * item.unitPrice * (1 - item.discountPercent / 100) * item.taxRate / 100,
      lineTotal: item.quantity * item.unitPrice * (1 - item.discountPercent / 100) * (1 + item.taxRate / 100),
      sortOrder: index,
    }));
    await db.insert(invoiceLineItems).values(itemsToInsert);
  }

  revalidatePath('/invoices', 'page');
  revalidateTag('invoices', 'page');

  return { invoice: newInvoice };
}

export async function updateInvoice(reference: string, input: UpdateInvoiceInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'invoices:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateInvoiceSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(invoices).where(eq(invoices.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Invoice not found');

  // Recalculate totals if line items provided
  let subtotal = validated.subtotal ?? existing[0].subtotal;
  let taxAmount = validated.taxAmount ?? existing[0].taxAmount;
  let discountAmount = validated.discountAmount ?? existing[0].discountAmount;
  let totalAmount = validated.totalAmount ?? existing[0].totalAmount;

  if (validated.lineItems && validated.lineItems.length > 0) {
    subtotal = validated.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    discountAmount = validated.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discountPercent / 100), 0);
    taxAmount = validated.lineItems.reduce((sum, item) => {
      const lineSubtotal = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      return sum + (lineSubtotal * item.taxRate / 100);
    }, 0);
    totalAmount = subtotal - discountAmount + taxAmount;
  }

  const [updated] = await db
    .update(invoices)
    .set({
      ...validated,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      updatedAt: now,
    })
    .where(eq(invoices.reference, reference))
    .returning();

  // Update line items if provided
  if (validated.lineItems && validated.lineItems.length > 0) {
    // Delete existing line items
    await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceReference, reference));
    // Insert new ones
    const itemsToInsert = validated.lineItems.map((item, index) => ({
      invoiceReference: reference,
      productReference: item.productReference,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      discountAmount: item.quantity * item.unitPrice * item.discountPercent / 100,
      taxRate: item.taxRate,
      taxAmount: item.quantity * item.unitPrice * (1 - item.discountPercent / 100) * item.taxRate / 100,
      lineTotal: item.quantity * item.unitPrice * (1 - item.discountPercent / 100) * (1 + item.taxRate / 100),
      sortOrder: index,
    }));
    await db.insert(invoiceLineItems).values(itemsToInsert);
  }

  revalidatePath('/invoices', 'page');
  revalidatePath(`/invoices/${reference}`, 'page');
  revalidateTag('invoices', 'page');

  return { invoice: updated };
}

export async function deleteInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'invoices:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(invoices).where(eq(invoices.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Invoice not found');

  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceReference, reference));
  await db.delete(invoices).where(eq(invoices.reference, reference));

  revalidatePath('/invoices', 'page');
  revalidateTag('invoices', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}