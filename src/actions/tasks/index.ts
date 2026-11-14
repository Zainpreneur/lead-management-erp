'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { tasks, people } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import { generateReference } from '@/lib/utils';

export async function listTasks(filters: { 
  search?: string; 
  status?: string; 
  priority?: string; 
  assignedTo?: number; 
  relatedType?: string; 
  relatedReference?: string;
  limit?: number; 
  page?: number 
} = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'tasks:read')) {
    throw new Error('Unauthorized');
  }

  const { search, status, priority, assignedTo, relatedType, relatedReference, limit = 10, page = 1 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(tasks.title, `%${search}%`),
      ilike(tasks.reference, `%${search}%`),
      ilike(tasks.description, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(tasks.status, status));
  if (priority) conditions.push(eq(tasks.priority, priority));
  if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
  if (relatedType) conditions.push(eq(tasks.relatedType, relatedType));
  if (relatedReference) conditions.push(eq(tasks.relatedReference, relatedReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: tasks.id,
        reference: tasks.reference,
        title: tasks.title,
        description: tasks.description,
        relatedType: tasks.relatedType,
        relatedReference: tasks.relatedReference,
        dueDate: tasks.dueDate,
        status: tasks.status,
        priority: tasks.priority,
        assignedTo: tasks.assignedTo,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assignedToName: people.name,
      })
      .from(tasks)
      .leftJoin(people, eq(tasks.assignedTo, people.id))
      .where(where)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(tasks).where(where),
  ]);

  return {
    tasks: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getTask(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'tasks:read')) {
    throw new Error('Unauthorized');
  }

  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.reference, reference))
    .limit(1);

  if (!task[0]) throw new Error('Task not found');

  return { task: task[0] };
}

export async function createTask(input: {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  assignedTo?: number | null;
  relatedType?: string | null;
  relatedReference?: string | null;
}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'tasks:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const reference = await generateReference('TASK');

  const [newTask] = await db
    .insert(tasks)
    .values({
      reference,
      ...input,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/tasks', 'page');
  revalidateTag('tasks', 'page');

  return { task: newTask };
}

export async function updateTask(reference: string, input: Partial<{
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedTo: number | null;
  relatedType: string | null;
  relatedReference: string | null;
}>) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'tasks:write')) {
    throw new Error('Forbidden');
  }

  const now = new Date().toISOString();
  const existing = await db.select().from(tasks).where(eq(tasks.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Task not found');

  const [updated] = await db
    .update(tasks)
    .set({ ...input, updatedAt: now })
    .where(eq(tasks.reference, reference))
    .returning();

  revalidatePath('/tasks', 'page');
  revalidatePath(`/tasks/${reference}`, 'page');
  revalidateTag('tasks', 'page');

  return { task: updated };
}

export async function deleteTask(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'tasks:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(tasks).where(eq(tasks.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Task not found');

  await db.delete(tasks).where(eq(tasks.reference, reference));

  revalidatePath('/tasks', 'page');
  revalidateTag('tasks', 'page');

  return { ok: true };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}