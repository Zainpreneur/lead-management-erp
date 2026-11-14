'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseFilters,
} from '@/lib/validations/expenses';
import { generateReference } from '@/lib/utils';

export async function listExpenses(filters: ExpenseFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'expenses:read')) {
    throw new Error('Unauthorized');
  }

  const validated = expenseFiltersSchema.parse(filters);
  const { search, status, category, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(expenses.title, `%${search}%`),
      ilike(expenses.category, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(expenses.status, status));
  if (category) conditions.push(eq(expenses.category, category));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(where)
      .orderBy(desc(expenses.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(expenses).where(where),
  ]);

  return {
    expenses: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getExpense(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'expenses:read')) {
    throw new Error('Unauthorized');
  }

  const expense = await db
    .select()
    .from(expenses)
    .where(eq(expenses.reference, reference))
    .limit(1);

  if (!expense[0]) throw new Error('Expense not found');

  return { expense: expense[0] };
}

export async function createExpense(input: CreateExpenseInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'expenses:write')) {
    throw new Error('Forbidden');
  }

  const validated = createExpenseSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('EXP');

  const [newExpense] = await db
    .insert(expenses)
    .values({
      reference,
      ...validated,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/expenses', 'page');
  revalidateTag('expenses', 'page');

  return { expense: newExpense };
}

export async function updateExpense(reference: string, input: UpdateExpenseInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'expenses:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateExpenseSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(expenses).where(eq(expenses.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Expense not found');

  const [updated] = await db
    .update(expenses)
    .set({ ...validated, updatedAt: now })
    .where(eq(expenses.reference, reference))
    .returning();

  revalidatePath('/expenses', 'page');
  revalidatePath(`/expenses/${reference}`, 'page');
  revalidateTag('expenses', 'page');

  return { expense: updated };
}

export async function deleteExpense(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'expenses:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(expenses).where(eq(expenses.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Expense not found');

  await db.delete(expenses).where(eq(expenses.reference, reference));

  revalidatePath('/expenses', 'page');
  revalidateTag('expenses', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}