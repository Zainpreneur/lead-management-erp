'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';

export async function listProducts(filters: { search?: string; status?: string; type?: string; limit?: number; page?: number } = {}) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'products:read')) {
    throw new Error('Unauthorized');
  }

  const { search, status, type, limit = 20, page = 1 } = filters;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(products.name, `%${search}%`),
      ilike(products.reference, `%${search}%`),
      ilike(products.sku, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(products.status, status));
  if (type) conditions.push(eq(products.type, type));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(products).where(where),
  ]);

  return {
    products: data,
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