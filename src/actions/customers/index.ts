'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { customers, customerActivities, people, leads } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerFiltersSchema,
  customerActivitySchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerFilters,
  type CustomerActivityInput,
} from '@/lib/validations/customers';
import { generateReference } from '@/lib/utils';

export async function listCustomers(filters: CustomerFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:read')) {
    throw new Error('Unauthorized');
  }

  const validated = customerFiltersSchema.parse(filters);
  const { search, status, assignedTo, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(customers.name, `%${search}%`),
      ilike(customers.reference, `%${search}%`),
      ilike(customers.contactName, `%${search}%`),
      ilike(customers.contactEmail, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(customers.status, status));
  if (assignedTo) conditions.push(eq(customers.assignedTo, assignedTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: customers.id,
        reference: customers.reference,
        leadId: customers.leadId,
        leadReference: customers.leadReference,
        name: customers.name,
        category: customers.category,
        city: customers.city,
        country: customers.country,
        contactName: customers.contactName,
        contactRole: customers.contactRole,
        contactEmail: customers.contactEmail,
        contactPhone: customers.contactPhone,
        social: customers.social,
        notes: customers.notes,
        assignedTo: customers.assignedTo,
        assignedTeam: customers.assignedTeam,
        status: customers.status,
        mrr: customers.mrr,
        totalValue: customers.totalValue,
        firstConvertedAt: customers.firstConvertedAt,
        lastActivityAt: customers.lastActivityAt,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        assignedToName: people.name,
      })
      .from(customers)
      .leftJoin(people, eq(customers.assignedTo, people.id))
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(customers).where(where),
  ]);

  return {
    customers: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getCustomer(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:read')) {
    throw new Error('Unauthorized');
  }

  const customer = await db
    .select({
      id: customers.id,
      reference: customers.reference,
      leadId: customers.leadId,
      leadReference: customers.leadReference,
      name: customers.name,
      category: customers.category,
      city: customers.city,
      country: customers.country,
      contactName: customers.contactName,
      contactRole: customers.contactRole,
      contactEmail: customers.contactEmail,
      contactPhone: customers.contactPhone,
      social: customers.social,
      notes: customers.notes,
      assignedTo: customers.assignedTo,
      assignedTeam: customers.assignedTeam,
      status: customers.status,
      mrr: customers.mrr,
      totalValue: customers.totalValue,
      firstConvertedAt: customers.firstConvertedAt,
      lastActivityAt: customers.lastActivityAt,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      assignedToName: people.name,
    })
    .from(customers)
    .leftJoin(people, eq(customers.assignedTo, people.id))
    .where(eq(customers.reference, reference))
    .limit(1);

  if (!customer[0]) throw new Error('Customer not found');

  const activities = await db
    .select()
    .from(customerActivities)
    .where(eq(customerActivities.customerId, customer[0].id))
    .orderBy(desc(customerActivities.createdAt));

  return { customer: { ...customer[0], activities } };
}

export async function createCustomer(input: CreateCustomerInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:write')) {
    throw new Error('Forbidden');
  }

  const validated = createCustomerSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('CUST');

  const [newCustomer] = await db
    .insert(customers)
    .values({
      reference,
      name: validated.name,
      category: validated.category,
      city: validated.city,
      country: validated.country,
      contactName: validated.contactName,
      contactRole: validated.contactRole,
      contactEmail: validated.contactEmail,
      contactPhone: validated.contactPhone,
      social: validated.social ? JSON.stringify(validated.social) : '{}',
      notes: validated.notes,
      assignedTo: validated.assignedTo,
      assignedTeam: validated.assignedTeam,
      status: validated.status,
      mrr: validated.mrr,
      totalValue: validated.totalValue,
      leadReference: validated.leadReference,
      firstConvertedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/customers', 'page');
  revalidateTag('customers', 'page');

  return { customer: newCustomer };
}

export async function updateCustomer(reference: string, input: UpdateCustomerInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateCustomerSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(customers).where(eq(customers.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Customer not found');

  // Handle social field separately
  const { social, ...restValidated } = validated;
  const updateData: Record<string, unknown> = { ...restValidated, updatedAt: now };
  if (social !== undefined) {
    updateData.social = social ? JSON.stringify(social) : '{}';
  }

  const [updated] = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.reference, reference))
    .returning();

  revalidatePath('/customers', 'page');
  revalidatePath(`/customers/${reference}`, 'page');
  revalidateTag('customers', 'page');

  return { customer: updated };
}

export async function deleteCustomer(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(customers).where(eq(customers.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Customer not found');

  await db.delete(customers).where(eq(customers.reference, reference));

  revalidatePath('/customers', 'page');
  revalidateTag('customers', 'page');

  return { ok: true };
}

export async function addCustomerActivity(reference: string, input: CustomerActivityInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'customers:write')) {
    throw new Error('Forbidden');
  }

  const validated = customerActivitySchema.parse(input);
  const customer = await db.select().from(customers).where(eq(customers.reference, reference)).limit(1);
  if (!customer[0]) throw new Error('Customer not found');

  const now = new Date().toISOString();
  await db.insert(customerActivities).values({
    customerId: customer[0].id,
    ...validated,
    actor: user.name,
    createdAt: now,
  });

  await db
    .update(customers)
    .set({ lastActivityAt: now, updatedAt: now })
    .where(eq(customers.reference, reference));

  revalidatePath(`/customers/${reference}`, 'page');
  revalidateTag('customers', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}