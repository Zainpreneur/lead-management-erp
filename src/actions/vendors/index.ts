'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { vendors, vendorPayouts } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFiltersSchema,
  type CreateVendorInput,
  type UpdateVendorInput,
  type VendorFilters,
} from '@/lib/validations/vendors';
import { generateReference } from '@/lib/utils';

export async function listVendors(filters: VendorFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:read')) {
    throw new Error('Unauthorized');
  }

  const validated = vendorFiltersSchema.parse(filters);
  const { search, status, kind, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(vendors.name, `%${search}%`),
      ilike(vendors.reference, `%${search}%`),
      ilike(vendors.code, `%${search}%`),
      ilike(vendors.city, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(vendors.status, status));
  if (kind) conditions.push(eq(vendors.kind, kind));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(vendors)
      .where(where)
      .orderBy(desc(vendors.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(vendors).where(where),
  ]);

  return {
    vendors: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getVendor(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:read')) {
    throw new Error('Unauthorized');
  }

  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.reference, reference))
    .limit(1);

  if (!vendor[0]) throw new Error('Vendor not found');

  return { vendor: vendor[0] };
}

export async function createVendor(input: CreateVendorInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const validated = createVendorSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('VEN');

  const [newVendor] = await db
    .insert(vendors)
    .values({
      reference,
      ...validated,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/vendors', 'page');
  revalidateTag('vendors', 'page');

  return { vendor: newVendor };
}

export async function updateVendor(reference: string, input: UpdateVendorInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateVendorSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(vendors).where(eq(vendors.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Vendor not found');

  const [updated] = await db
    .update(vendors)
    .set({ ...validated, updatedAt: now })
    .where(eq(vendors.reference, reference))
    .returning();

  revalidatePath('/vendors', 'page');
  revalidatePath(`/vendors/${reference}`, 'page');
  revalidateTag('vendors', 'page');

  return { vendor: updated };
}

export async function deleteVendor(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(vendors).where(eq(vendors.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Vendor not found');

  await db.delete(vendors).where(eq(vendors.reference, reference));

  revalidatePath('/vendors', 'page');
  revalidateTag('vendors', 'page');

  return { ok: true };
}

// Vendor Payouts
export async function listVendorPayouts(filters: { 
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
      ilike(vendorPayouts.reference, `%${search}%`),
      ilike(vendorPayouts.deliverable, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(vendorPayouts.status, status));
  if (vendorReference) conditions.push(eq(vendorPayouts.vendorReference, vendorReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: vendorPayouts.id,
        reference: vendorPayouts.reference,
        vendorReference: vendorPayouts.vendorReference,
        sourcingRequestReference: vendorPayouts.sourcingRequestReference,
        deliverable: vendorPayouts.deliverable,
        amount: vendorPayouts.amount,
        triggerType: vendorPayouts.triggerType,
        status: vendorPayouts.status,
        released: vendorPayouts.released,
        releasedAt: vendorPayouts.releasedAt,
        releasedBy: vendorPayouts.releasedBy,
        notes: vendorPayouts.notes,
        createdAt: vendorPayouts.createdAt,
        updatedAt: vendorPayouts.updatedAt,
        vendorName: vendors.name,
      })
      .from(vendorPayouts)
      .leftJoin(vendors, eq(vendorPayouts.vendorReference, vendors.reference))
      .where(where)
      .orderBy(desc(vendorPayouts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(vendorPayouts).where(where),
  ]);

  return {
    payouts: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function createVendorPayout(input: {
  vendorReference: string;
  sourcingRequestReference?: string | null;
  deliverable: string;
  amount: number;
  triggerType: string;
  status: string;
  notes?: string | null;
}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const reference = await generateReference('VP');

  await db.transaction(async (tx) => {
    await tx.insert(vendorPayouts).values({
      reference,
      vendorReference: input.vendorReference,
      sourcingRequestReference: input.sourcingRequestReference,
      deliverable: input.deliverable,
      amount: input.amount,
      triggerType: input.triggerType,
      status: input.status,
      released: false,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    });
  });

  revalidatePath('/vendor-payouts', 'page');
  revalidateTag('vendor-payouts', 'page');

  return { payout: { reference, ...input } };
}

export async function updateVendorPayoutStatus(reference: string, status: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const updated = await db
    .update(vendorPayouts)
    .set({ status, updatedAt: now })
    .where(eq(vendorPayouts.reference, reference))
    .returning();

  if (!updated[0]) throw new Error('Vendor payout not found');

  revalidatePath('/vendor-payouts', 'page');
  revalidateTag('vendor-payouts', 'page');

  return { payout: updated[0] };
}

export async function releaseVendorPayout(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const updated = await db
    .update(vendorPayouts)
    .set({ 
      status: 'released', 
      released: true, 
      releasedAt: now, 
      releasedBy: user.name,
      updatedAt: now 
    })
    .where(eq(vendorPayouts.reference, reference))
    .returning();

  if (!updated[0]) throw new Error('Vendor payout not found');

  revalidatePath('/vendor-payouts', 'page');
  revalidateTag('vendor-payouts', 'page');

  return { payout: updated[0] };
}

export async function deleteVendorPayout(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'vendors:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(vendorPayouts).where(eq(vendorPayouts.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Vendor payout not found');

  await db.delete(vendorPayouts).where(eq(vendorPayouts.reference, reference));

  revalidatePath('/vendor-payouts', 'page');
  revalidateTag('vendor-payouts', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}