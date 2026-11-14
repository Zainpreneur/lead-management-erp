'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { employees, people } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import { generateReference } from '@/lib/utils';

export async function listEmployees(filters: { 
  search?: string; 
  status?: string; 
  department?: string; 
  limit?: number; 
  page?: number 
} = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'employees:read')) {
    throw new Error('Unauthorized');
  }

  const { search, status, department, limit = 10, page = 1 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(employees.firstName, `%${search}%`),
      ilike(employees.lastName, `%${search}%`),
      ilike(employees.reference, `%${search}%`),
      ilike(employees.email, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(employees.status, status));
  if (department) conditions.push(eq(employees.department, department));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: employees.id,
        reference: employees.reference,
        personId: employees.personId,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        phone: employees.phone,
        department: employees.department,
        position: employees.position,
        employmentType: employees.employmentType,
        classification: employees.classification,
        hireDate: employees.hireDate,
        terminationDate: employees.terminationDate,
        status: employees.status,
        baseSalary: employees.baseSalary,
        currency: employees.currency,
        managerId: employees.managerId,
        notes: employees.notes,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .where(where)
      .orderBy(desc(employees.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(employees).where(where),
  ]);

  return {
    employees: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function listPeople() {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'people:read')) {
    throw new Error('Unauthorized');
  }

  const data = await db
    .select()
    .from(people)
    .where(eq(people.isActive, true))
    .orderBy(people.name);

  return { people: data };
}

export async function createEmployee(input: {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string;
  classification?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: string;
  baseSalary?: number;
  currency?: string;
  managerId?: number | null;
  notes?: string | null;
}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'employees:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const reference = await generateReference('EMP');

  const [newEmployee] = await db
    .insert(employees)
    .values({
      reference,
      ...input,
      classification: input.classification || 'employee',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/employees', 'page');
  revalidateTag('employees', 'page');

  return { employee: newEmployee };
}

export async function updateEmployee(reference: string, input: {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  employmentType?: string;
  classification?: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  status?: string;
  baseSalary?: number;
  currency?: string;
  managerId?: number | null;
  notes?: string | null;
}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'employees:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const existing = await db.select().from(employees).where(eq(employees.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Employee not found');

  const [updated] = await db
    .update(employees)
    .set({ ...input, updatedAt: now })
    .where(eq(employees.reference, reference))
    .returning();

  revalidatePath('/employees', 'page');
  revalidateTag('employees', 'page');

  return { employee: updated };
}

export async function deleteEmployee(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'employees:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(employees).where(eq(employees.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Employee not found');

  await db.delete(employees).where(eq(employees.reference, reference));

  revalidatePath('/employees', 'page');
  revalidateTag('employees', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}