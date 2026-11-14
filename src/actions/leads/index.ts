'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { leads, leadActivities, people, customers } from '@/db/schema';
import { eq, desc, and, or, like, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createLeadSchema,
  updateLeadSchema,
  leadFiltersSchema,
  convertLeadSchema,
  leadActivitySchema,
  type CreateLeadInput,
  type UpdateLeadInput,
  type LeadFilters,
  type ConvertLeadInput,
  type LeadActivityInput,
} from '@/lib/validations/leads';
import { generateReference } from '@/lib/utils';

export async function listLeads(filters: LeadFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:read')) {
    throw new Error('Unauthorized');
  }

  const validated = leadFiltersSchema.parse(filters);
  const { search, stage, source, priority, assignedTo, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(leads.name, `%${search}%`),
      ilike(leads.reference, `%${search}%`),
      ilike(leads.contactName, `%${search}%`),
      ilike(leads.contactEmail, `%${search}%`)
    )!);
  }
  if (stage) conditions.push(eq(leads.stage, stage));
  if (source) conditions.push(eq(leads.source, source));
  if (priority) conditions.push(eq(leads.priority, priority));
  if (assignedTo) conditions.push(eq(leads.assignedTo, assignedTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: leads.id,
        reference: leads.reference,
        name: leads.name,
        category: leads.category,
        city: leads.city,
        country: leads.country,
        source: leads.source,
        stage: leads.stage,
        priority: leads.priority,
        score: leads.score,
        estimatedValue: leads.estimatedValue,
        contactName: leads.contactName,
        contactRole: leads.contactRole,
        contactEmail: leads.contactEmail,
        contactPhone: leads.contactPhone,
        assignedTo: leads.assignedTo,
        assignedTeam: leads.assignedTeam,
        followUpDate: leads.followUpDate,
        lastContactedAt: leads.lastContactedAt,
        reminderDays: leads.reminderDays,
        convertedAt: leads.convertedAt,
        lostReason: leads.lostReason,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        assignedToName: people.name,
      })
      .from(leads)
      .leftJoin(people, eq(leads.assignedTo, people.id))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(leads).where(where),
  ]);

  return {
    leads: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getLead(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:read')) {
    throw new Error('Unauthorized');
  }

  const lead = await db
    .select({
      id: leads.id,
      reference: leads.reference,
      name: leads.name,
      category: leads.category,
      city: leads.city,
      country: leads.country,
      source: leads.source,
      stage: leads.stage,
      priority: leads.priority,
      score: leads.score,
      estimatedValue: leads.estimatedValue,
      contactName: leads.contactName,
      contactRole: leads.contactRole,
      contactEmail: leads.contactEmail,
      contactPhone: leads.contactPhone,
      social: leads.social,
      notes: leads.notes,
      assignedTo: leads.assignedTo,
      assignedTeam: leads.assignedTeam,
      followUpDate: leads.followUpDate,
      lastContactedAt: leads.lastContactedAt,
      reminderDays: leads.reminderDays,
      convertedAt: leads.convertedAt,
      lostReason: leads.lostReason,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      assignedToName: people.name,
    })
    .from(leads)
    .leftJoin(people, eq(leads.assignedTo, people.id))
    .where(eq(leads.reference, reference))
    .limit(1);

  if (!lead[0]) throw new Error('Lead not found');

  const activities = await db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, lead[0].id))
    .orderBy(desc(leadActivities.createdAt));

  return { lead: { ...lead[0], activities } };
}

export async function createLead(input: CreateLeadInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:write')) {
    throw new Error('Forbidden');
  }

  const validated = createLeadSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('LEAD');

  const [newLead] = await db
    .insert(leads)
    .values({
      reference,
      ...validated,
      social: validated.social ? JSON.stringify(validated.social) : '{}',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Create initial activity
  await db.insert(leadActivities).values({
    leadId: newLead.id,
    kind: 'created',
    summary: `Lead created by ${user.name}`,
    actor: user.name,
    createdAt: now,
  });

  revalidatePath('/leads', 'page');
  revalidateTag('leads', 'page');

  return { lead: newLead };
}

export async function updateLead(reference: string, input: UpdateLeadInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateLeadSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(leads).where(eq(leads.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Lead not found');

  // Handle social field separately
  const { social, ...restValidated } = validated;
  const updateData: Record<string, unknown> = { ...restValidated, updatedAt: now };
  if (social !== undefined) {
    updateData.social = social ? JSON.stringify(social) : '{}';
  }

  const [updated] = await db
    .update(leads)
    .set(updateData)
    .where(eq(leads.reference, reference))
    .returning();

  // Log activity if stage changed
  if (validated.stage && validated.stage !== existing[0].stage) {
    await db.insert(leadActivities).values({
      leadId: existing[0].id,
      kind: 'stage_changed',
      summary: `Stage changed from ${existing[0].stage} to ${validated.stage}`,
      actor: user.name,
      createdAt: now,
    });
  }

  revalidatePath('/leads', 'page');
  revalidatePath(`/leads/${reference}`, 'page');
  revalidateTag('leads', 'page');

  return { lead: updated };
}

export async function deleteLead(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(leads).where(eq(leads.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Lead not found');

  await db.delete(leads).where(eq(leads.reference, reference));

  revalidatePath('/leads', 'page');
  revalidateTag('leads', 'page');

  return { ok: true };
}

export async function convertLead(reference: string, input: ConvertLeadInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:write')) {
    throw new Error('Forbidden');
  }

  const validated = convertLeadSchema.parse(input);
  const now = new Date().toISOString();

  const lead = await db.select().from(leads).where(eq(leads.reference, reference)).limit(1);
  if (!lead[0]) throw new Error('Lead not found');
  if (lead[0].convertedAt) throw new Error('Lead already converted');

  // Create customer
  const customerRef = await generateReference('CUST');
  const [customer] = await db
    .insert(customers)
    .values({
      reference: customerRef,
      leadId: lead[0].id,
      leadReference: lead[0].reference,
      name: validated.customerName || lead[0].name,
      category: validated.customerCategory || lead[0].category,
      city: validated.customerCity || lead[0].city,
      country: validated.customerCountry || lead[0].country,
      contactName: validated.contactName || lead[0].contactName,
      contactRole: validated.contactRole || lead[0].contactRole,
      contactEmail: validated.contactEmail || lead[0].contactEmail,
      contactPhone: validated.contactPhone || lead[0].contactPhone,
      notes: validated.notes || lead[0].notes,
      assignedTo: validated.assignedTo || lead[0].assignedTo,
      assignedTeam: validated.assignedTeam || lead[0].assignedTeam,
      status: 'active',
      firstConvertedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  // Update lead
  await db
    .update(leads)
    .set({
      convertedAt: now,
      stage: 'won',
      updatedAt: now,
    })
    .where(eq(leads.reference, reference));

  // Log activities
  await db.insert(leadActivities).values({
    leadId: lead[0].id,
    kind: 'converted',
    summary: `Converted to customer ${customer.reference} by ${user.name}`,
    actor: user.name,
    createdAt: now,
  });

  revalidatePath('/leads', 'page');
  revalidatePath('/customers', 'page');
  revalidateTag('leads', 'page');
  revalidateTag('customers', 'page');

  return { customer, lead: { ...lead[0], convertedAt: now, stage: 'won' } };
}

export async function addLeadActivity(reference: string, input: LeadActivityInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'leads:write')) {
    throw new Error('Forbidden');
  }

  const validated = leadActivitySchema.parse(input);
  const lead = await db.select().from(leads).where(eq(leads.reference, reference)).limit(1);
  if (!lead[0]) throw new Error('Lead not found');

  const now = new Date().toISOString();
  await db.insert(leadActivities).values({
    leadId: lead[0].id,
    ...validated,
    actor: user.name,
    createdAt: now,
  });

  await db
    .update(leads)
    .set({ lastContactedAt: now, updatedAt: now })
    .where(eq(leads.reference, reference));

  revalidatePath(`/leads/${reference}`, 'page');
  revalidateTag('leads', 'page');

  return { ok: true };
}

// Helper to get user from request headers (for Server Actions)
async function getUserRequest() {
  // In Server Actions, we can't access request headers directly
  // This would need to be implemented with a different auth approach
  // For now, return a mock admin user - replace with actual auth
  return { id: 1, name: 'System', role: 'admin', team: null };
}