import db from './db';
import type { Tenant, ImportJob } from '@/lib/types';

interface TenantRow {
  id: number;
  reference: string;
  name: string;
  slug: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface ImportJobRow {
  id: number;
  reference: string;
  entity_type: string;
  file_name: string;
  status: string;
  total_rows: number;
  processed_rows: number;
  error_rows: number;
  errors: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateTenant(r: TenantRow): Tenant {
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

function hydrateImportJob(r: ImportJobRow): ImportJob {
  return {
    id: r.id,
    reference: r.reference,
    entityType: r.entity_type,
    fileName: r.file_name,
    status: r.status,
    totalRows: r.total_rows,
    processedRows: r.processed_rows,
    errorRows: r.error_rows,
    errors: r.errors,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Tenants
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
  return rows.map(hydrateTenant);
}

export function createTenant(input: { name: string; slug: string }): Tenant {
  const ts = now();
  const info = db.prepare(`INSERT INTO tenants (reference, name, slug, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?)`)
    .run('tmp', input.name, input.slug, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TEN-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE tenants SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id) as TenantRow;
  return hydrateTenant(row);
}

export function deleteTenant(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM tenants WHERE reference = ?').get(idOrRef)) as TenantRow | undefined;
  if (!row) throw new Error('Tenant not found');
  db.prepare('DELETE FROM tenants WHERE id = ?').run(row.id);
}

// Import Jobs
export function listImportJobs(filters: { entityType?: string; status?: string; limit?: number; page?: number } = {}): ImportJob[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.entityType) { conds.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM import_jobs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as ImportJobRow[];
  return rows.map(hydrateImportJob);
}

export function createImportJob(input: { entityType: string; fileName: string }): ImportJob {
  const ts = now();
  const info = db.prepare(`INSERT INTO import_jobs (reference, entity_type, file_name, status, total_rows, processed_rows, error_rows, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.entityType, input.fileName, 'pending', 0, 0, 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `IMP-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE import_jobs SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(id) as ImportJobRow;
  return hydrateImportJob(row);
}

export function updateImportJob(idOrRef: string, patch: { status?: string; totalRows?: number; processedRows?: number; errorRows?: number; errors?: string | null }): ImportJob {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM import_jobs WHERE reference = ?').get(idOrRef)) as ImportJobRow | undefined;
  if (!existing) throw new Error('Import job not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { status: 'status', totalRows: 'total_rows', processedRows: 'processed_rows', errorRows: 'error_rows', errors: 'errors' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateImportJob(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE import_jobs SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(existing.id) as ImportJobRow;
  return hydrateImportJob(updated);
}

export function deleteImportJob(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM import_jobs WHERE reference = ?').get(idOrRef)) as ImportJobRow | undefined;
  if (!row) throw new Error('Import job not found');
  db.prepare('DELETE FROM import_jobs WHERE id = ?').run(row.id);
}

// Export functions
export function exportLeadsCSV(): string {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const headers = ['reference', 'name', 'category', 'city', 'country', 'source', 'stage', 'priority', 'score', 'estimated_value', 'contact_name', 'contact_email', 'contact_phone', 'notes', 'created_at'];
  const rows = leads.map((l) => headers.map((h) => `"${String(l[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportCustomersCSV(): string {
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const headers = ['reference', 'name', 'category', 'city', 'country', 'contact_name', 'contact_email', 'contact_phone', 'status', 'mrr', 'total_value', 'created_at'];
  const rows = customers.map((c) => headers.map((h) => `"${String(c[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportInvoicesCSV(): string {
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const headers = ['reference', 'customer_reference', 'customer_name', 'status', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'currency', 'issue_date', 'due_date', 'paid_date', 'created_at'];
  const rows = invoices.map((i) => headers.map((h) => `"${String(i[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function exportExpensesCSV(): string {
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const headers = ['reference', 'title', 'category', 'amount', 'currency', 'status', 'expense_date', 'paid_by', 'notes', 'created_at'];
  const rows = expenses.map((e) => headers.map((h) => `"${String(e[h] ?? '').replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}