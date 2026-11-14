import db from './db';
import type { Tenant } from '@/lib/types';

interface TenantRow {
  id: number;
  reference: string;
  name: string;
  slug: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrate(r: TenantRow): Tenant {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    slug: r.slug,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listTenants(filters: { search?: string; limit?: number; page?: number } = {}): Tenant[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ? OR slug LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM tenants ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TenantRow[];
  return rows.map(hydrate);
}

export function getTenantByIdOrRef(idOrRef: string): Tenant | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(Number(idOrRef))
    : db.prepare('SELECT * FROM tenants WHERE reference = ?').get(idOrRef)) as TenantRow | undefined;
  if (!row) return null;
  return hydrate(row);
}

export function createTenant(input: { name: string; slug: string }): Tenant {
  const ts = now();
  const info = db.prepare(`INSERT INTO tenants (reference, name, slug, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?)`)
    .run('tmp', input.name, input.slug, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TEN-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE tenants SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id) as TenantRow;
  return hydrate(row);
}

export function updateTenant(idOrRef: string, patch: { name?: string; slug?: string; isActive?: boolean }): Tenant {
  const existing = getTenantByIdOrRef(idOrRef);
  if (!existing) throw new Error('Tenant not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', slug: 'slug', isActive: 'is_active' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return existing;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getTenantByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update tenant');
  return updated;
}

export function deleteTenant(idOrRef: string): void {
  const existing = getTenantByIdOrRef(idOrRef);
  if (!existing) throw new Error('Tenant not found');
  db.prepare('DELETE FROM tenants WHERE id = ?').run(existing.id);
}

export function addTenantMember(tenantRef: string, userId: number, role: string = 'member'): void {
  const ts = now();
  db.prepare(`INSERT INTO tenant_members (tenant_reference, user_id, role, created_at) VALUES (?,?,?,?)`)
    .run(tenantRef, userId, role, ts);
}

export function listTenantMembers(tenantRef: string) {
  const rows = db.prepare(`SELECT tm.*, u.name, u.email FROM tenant_members tm JOIN users u ON u.id = tm.user_id WHERE tm.tenant_reference = ?`).all(tenantRef) as Array<{ id: number; tenant_reference: string; user_id: number; role: string; created_at: string; name: string; email: string }>;
  return rows.map((r) => ({
    id: r.id,
    tenantReference: r.tenant_reference,
    userId: r.user_id,
    role: r.role,
    name: r.name,
    email: r.email,
    createdAt: r.created_at,
  }));
}

export function removeTenantMember(tenantRef: string, userId: number): void {
  db.prepare('DELETE FROM tenant_members WHERE tenant_reference = ? AND user_id = ?').run(tenantRef, userId);
}