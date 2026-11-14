import db from './db';
import type { Customer, CustomerInput, CustomerSummary, CustomerActivity } from '@/lib/types';


interface CustomerRow {
  id: number;
  reference: string;
  lead_id: number | null;
  lead_reference: string | null;
  name: string;
  category: string | null;
  city: string | null;
  country: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social: string | null;
  notes: string | null;
  assigned_to: number | null;
  assigned_team: string | null;
  assigned_to_name: string | null;
  status: string;
  mrr: number;
  total_value: number;
  first_converted_at: string;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function safeParse(v: string | null): Record<string, string> {
  if (!v) return {};
  try { return JSON.parse(v) ?? {}; } catch { return {}; }
}

function loadActivities(customerId: number): CustomerActivity[] {
  const rows = db.prepare('SELECT id, kind, summary, outcome, actor, created_at FROM customer_activities WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as Array<{
    id: number; kind: string; summary: string; outcome: string | null; actor: string; created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    customerReference: '',
    kind: r.kind,
    summary: r.summary,
    outcome: r.outcome,
    actor: r.actor,
    createdAt: r.created_at,
  }));
}

function hydrate(row: CustomerRow, activities: CustomerActivity[]): Customer {
  return {
    id: row.id,
    reference: row.reference,
    leadId: row.lead_id,
    leadReference: row.lead_reference,
    name: row.name,
    category: row.category,
    city: row.city,
    country: row.country,
    contactName: row.contact_name,
    contactRole: row.contact_role,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    social: safeParse(row.social),
    notes: row.notes,
    assignedTo: row.assigned_to,
    assignedTeam: row.assigned_team,
    assignedToName: row.assigned_to_name,
    status: row.status,
    mrr: row.mrr,
    totalValue: row.total_value,
    firstConvertedAt: row.first_converted_at,
    lastActivityAt: row.last_activity_at,
    activities: activities.map((a) => ({ ...a, customerReference: row.reference })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_BASE = `
SELECT c.*, p.name AS assigned_to_name
FROM customers c
LEFT JOIN people p ON p.id = c.assigned_to
`;

export function listCustomers(filters: { search?: string; status?: string; assignedTo?: number; limit?: number; page?: number } = {}): Customer[] {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conditions.push('(c.name LIKE ? OR c.city LIKE ? OR c.category LIKE ? OR c.contact_name LIKE ? OR c.contact_email LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q, q, q);
  }
  if (filters.status) { conditions.push('c.status = ?'); params.push(filters.status); }
  if (filters.assignedTo) { conditions.push('c.assigned_to = ?'); params.push(filters.assignedTo); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`${SELECT_BASE} ${where} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as CustomerRow[];
  return rows.map((r) => hydrate(r, loadActivities(r.id)));
}

export function getCustomerByIdOrRef(idOrRef: string): Customer | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare(`${SELECT_BASE} WHERE c.id = ?`).get(Number(idOrRef))
    : db.prepare(`${SELECT_BASE} WHERE c.reference = ?`).get(idOrRef)) as CustomerRow | undefined;
  if (!row) return null;
  return hydrate(row, loadActivities(row.id));
}

export function createCustomer(input: CustomerInput): Customer {
  const ts = now();
  const insert = db.prepare(`
    INSERT INTO customers (reference, lead_id, lead_reference, name, category, city, country, contact_name, contact_role,
      contact_email, contact_phone, social, notes, assigned_to, assigned_team, status, mrr, total_value,
      first_converted_at, created_at, updated_at)
    VALUES (@reference, @lead_id, @lead_reference, @name, @category, @city, @country, @contact_name, @contact_role,
      @contact_email, @contact_phone, @social, @notes, @assigned_to, @assigned_team, @status, @mrr, @total_value,
      @first_converted_at, @created_at, @updated_at)
  `);
  const tx = db.transaction(() => {
    const info = insert.run({
      reference: 'tmp',
      lead_id: null,
      lead_reference: input.leadReference ?? null,
      name: input.name,
      category: input.category ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      contact_name: input.contactName ?? null,
      contact_role: input.contactRole ?? null,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      social: JSON.stringify(input.social ?? {}),
      notes: input.notes ?? null,
      assigned_to: input.assignedTo ?? null,
      assigned_team: input.assignedTeam ?? null,
      status: input.status ?? 'active',
      mrr: input.mrr ?? 0,
      total_value: input.totalValue ?? 0,
      first_converted_at: ts,
      created_at: ts,
      updated_at: ts,
    });
    const id = Number(info.lastInsertRowid);
    const reference = `C-${String(id).padStart(4, '0')}`;
    db.prepare('UPDATE customers SET reference = ? WHERE id = ?').run(reference, id);
    db.prepare('INSERT INTO customer_activities (customer_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, 'created', 'Customer created', null, 'system', ts);
    return id;
  });
  const id = tx();
  const c = getCustomerByIdOrRef(String(id));
  if (!c) throw new Error('Failed to create customer');
  return c;
}

export function updateCustomer(idOrRef: string, patch: Partial<CustomerInput> & { status?: string }): Customer {
  const existing = getCustomerByIdOrRef(idOrRef);
  if (!existing) throw new Error('Customer not found');
  const id = existing.id;
  const fields: string[] = [];
  const params: Record<string, unknown> = { id };
  const map: Record<string, string> = {
    name: 'name',
    category: 'category',
    city: 'city',
    country: 'country',
    contactName: 'contact_name',
    contactRole: 'contact_role',
    contactEmail: 'contact_email',
    contactPhone: 'contact_phone',
    notes: 'notes',
    assignedTo: 'assigned_to',
    assignedTeam: 'assigned_team',
    status: 'status',
    mrr: 'mrr',
    totalValue: 'total_value',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'social')) {
    fields.push('social = @social');
    params.social = JSON.stringify(patch.social ?? {});
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'leadReference')) {
    fields.push('lead_reference = @lead_reference');
    params.lead_reference = patch.leadReference ?? null;
  }
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  const statusChanged = Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status !== existing.status;
  if (statusChanged) {
    fields.push('last_activity_at = @last_activity_at');
    params.last_activity_at = now();
    db.prepare('INSERT INTO customer_activities (customer_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)')
      .run(id, 'status_change', `Status changed from ${existing.status} to ${patch.status}`, null, 'system', now());
  }
  db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getCustomerByIdOrRef(String(id));
  if (!updated) throw new Error('Failed to update customer');
  return updated;
}

export function deleteCustomer(idOrRef: string): void {
  const existing = getCustomerByIdOrRef(idOrRef);
  if (!existing) throw new Error('Customer not found');
  db.prepare('DELETE FROM customers WHERE id = ?').run(existing.id);
}

export function customerSummary(): CustomerSummary {
  const total = (db.prepare('SELECT COUNT(*) c FROM customers').get() as { c: number }).c;
  const active = (db.prepare("SELECT COUNT(*) c FROM customers WHERE status='active'").get() as { c: number }).c;
  const paused = (db.prepare("SELECT COUNT(*) c FROM customers WHERE status='paused'").get() as { c: number }).c;
  const churned = (db.prepare("SELECT COUNT(*) c FROM customers WHERE status='churned'").get() as { c: number }).c;
  const archived = (db.prepare("SELECT COUNT(*) c FROM customers WHERE status='archived'").get() as { c: number }).c;
  const mrr = (db.prepare('SELECT COALESCE(SUM(mrr),0) v FROM customers').get() as { v: number }).v;
  const val = (db.prepare('SELECT COALESCE(SUM(total_value),0) v FROM customers').get() as { v: number }).v;
  const byStatusRows = db.prepare('SELECT status, COUNT(*) c FROM customers GROUP BY status').all() as Array<{ status: string; c: number }>;
  const byStatus: Record<string, number> = {};
  for (const r of byStatusRows) byStatus[r.status] = r.c;
  return { total, active, paused, churned, archived, totalMrr: mrr, totalValue: val, byStatus };
}

export function listPeopleForCustomers() {
  return (db.prepare('SELECT id, code, name, email, phone, team, role, is_active FROM people ORDER BY name').all() as Array<{
    id: number; code: string; name: string; email: string | null; phone: string | null; team: string; role: string; is_active: number;
  }>).map((r) => ({
    id: r.id, code: r.code, name: r.name, email: r.email, phone: r.phone, team: r.team, role: r.role, isActive: r.is_active === 1,
  }));
}