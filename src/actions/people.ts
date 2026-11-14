'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { people } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';

export async function listPeople(filters: { 
  search?: string; 
  team?: string; 
  role?: string; 
  isActive?: boolean;
  limit?: number; 
  page?: number 
} = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'people:read')) {
    throw new Error('Unauthorized');
  }

  const { search, team, role, isActive, limit = 50, page = 1 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(people.name, `%${search}%`),
      ilike(people.email, `%${search}%`),
      ilike(people.code, `%${search}%`)
    )!);
  }
  if (team) conditions.push(eq(people.team, team));
  if (role) conditions.push(eq(people.role, role));
  if (isActive !== undefined) conditions.push(eq(people.isActive, isActive));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(people)
      .where(where)
      .orderBy(desc(people.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(people).where(where),
  ]);

  return {
    people: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}