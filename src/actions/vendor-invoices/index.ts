'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { vendorInvoices, vendorInvoiceLines } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import { generateReference } from '@/lib/utils';

export async function listVendorInvoices(filters: { 
  search?: string; 
  status?: string; 
  vendorReference?: string;
  limit?: number; 
  page?: number 
} = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:read')) {
    throw new Error('Unauthorized');
  }

  const { search, status, vendorReference, limit = 20, page = 1 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(vendorInvoices.reference, `%${search}%`),
      ilike(vendorInvoices.notes, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(vendorInvoices.status, status));
  if (vendorReference) conditions.push(eq(vendorInvoices.vendorReference, vendorReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(vendorInvoices)
      .where(where)
      .orderBy(desc(vendorInvoices.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(vendorInvoices).where(where),
  ]);

  return {
    vendorInvoices: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getVendorInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:read')) {
    throw new Error('Unauthorized');
  }

  const invoice = await db
    .select()
    .from(vendorInvoices)
    .where(eq(vendorInvoices.reference, reference))
    .limit(1);

  if (!invoice[0]) throw new Error('Vendor invoice not found');

  const lines = await db
    .select()
    .from(vendorInvoiceLines)
    .where(eq(vendorInvoiceLines.vendorInvoiceReference, reference))
    .orderBy(vendorInvoiceLines.sequence);

  return { vendorInvoice: { ...invoice[0], lines } };
}

export async function createVendorInvoice(input: {
  vendorReference: string;
  sourcingRequestReference?: string | null;
  purchaseOrderReference?: string | null;
  goodsReceiptReference?: string | null;
  status?: string;
  currency?: string;
  subtotal?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  total?: number;
  issueDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  lines?: Array<{ description?: string | null; amount: number; currency?: string }>;
}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const reference = await generateReference('VIN');

  const lines = input.lines ?? [];
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const discount = input.discountAmount ?? 0;
  const taxable = subtotal - discount;
  const taxPercent = input.taxPercent ?? 0;
  const taxAmount = Math.round(taxable * taxPercent / 100 * 100) / 100;
  const total = taxable + taxAmount;

  await db.transaction(async (tx) => {
    await tx.insert(vendorInvoices).values({
      reference,
      vendorReference: input.vendorReference,
      sourcingRequestReference: input.sourcingRequestReference ?? null,
      status: input.status ?? 'draft',
      currency: input.currency ?? 'USD',
      subtotal,
      discountAmount: discount,
      taxPercent,
      taxAmount,
      total,
      issueDate: input.issueDate ?? now.slice(0, 10),
      dueDate: input.dueDate ?? null,
      notes: input.notes ?? null,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    });

    for (const [index, line] of lines.entries()) {
      await tx.insert(vendorInvoiceLines).values({
        vendorInvoiceReference: reference,
        sequence: index + 1,
        description: line.description ?? null,
        amount: line.amount,
        currency: line.currency ?? 'USD',
        createdAt: now,
      });
    }
  });

  revalidatePath('/vendor-invoices', 'page');
  revalidateTag('vendor-invoices', 'page');

  return { vendorInvoice: { reference, ...input, subtotal, taxAmount, total, matchStatus: 'pending', matchedAmount: 0 } };
}

export async function matchVendorInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const { matchVendorInvoice: matchServer } = await import('@/lib/server/vendor-finance');
  const result = matchServer(reference);

  revalidatePath('/vendor-invoices', 'page');
  revalidateTag('vendor-invoices', 'page');

  return result;
}

export async function autoMatchVendorInvoices() {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const { autoMatchVendorInvoices: autoMatchServer } = await import('@/lib/server/vendor-finance');
  const result = autoMatchServer();

  revalidatePath('/vendor-invoices', 'page');
  revalidateTag('vendor-invoices', 'page');

  return result;
}

export async function issueVendorInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const { issueVendorInvoice: issueServer } = await import('@/lib/server/vendor-finance');
  const result = issueServer(reference);

  revalidatePath('/vendor-invoices', 'page');
  revalidateTag('vendor-invoices', 'page');

  return result;
}

export async function voidVendorInvoice(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const { voidVendorInvoice: voidServer } = await import('@/lib/server/vendor-finance');
  const result = voidServer(reference);

  revalidatePath('/vendor-invoices', 'page');
  revalidateTag('vendor-invoices', 'page');

  return result;
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}