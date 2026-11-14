import db from './db';
import type { ServiceRequest, ServiceRequestInput } from '@/lib/types';

interface Row {
  id: number;
  reference: string;
  business_reference: string | null;
  title: string;
  status: string;
  priority: string;
  requested_by: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_role: string | null;
  assigned_team: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  required_date: string | null;
  special_requirements: string | null;
  final_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrate(r: Row): ServiceRequest {
  return {
    id: r.id,
    reference: r.reference,
    businessReference: r.business_reference,
    title: r.title,
    status: r.status,
    priority: r.priority,
    requestedBy: r.requested_by,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactRole: r.contact_role,
    assignedTeam: r.assigned_team,
    assignedTo: r.assigned_to,
    assignedToName: r.assigned_to_name,
    requiredDate: r.required_date,
    specialRequirements: r.special_requirements,
    finalAmount: r.final_amount,
    currency: r.currency,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listRequests(filters: { search?: string; status?: string; priority?: string; businessReference?: string; limit?: number; page?: number } = {}): ServiceRequest[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(r.title LIKE ? OR r.reference LIKE ? OR r.contact_name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.status) { conds.push('r.status = ?'); params.push(filters.status); }
  if (filters.priority) { conds.push('r.priority = ?'); params.push(filters.priority); }
  if (filters.businessReference) { conds.push('r.business_reference = ?'); params.push(filters.businessReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT r.*, p.name AS assigned_to_name FROM service_requests r LEFT JOIN people p ON p.id = r.assigned_to ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  return rows.map(hydrate);
}

export function getRequestByIdOrRef(idOrRef: string): ServiceRequest | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT r.*, p.name AS assigned_to_name FROM service_requests r LEFT JOIN people p ON p.id = r.assigned_to WHERE r.id = ?').get(Number(idOrRef))
    : db.prepare('SELECT r.*, p.name AS assigned_to_name FROM service_requests r LEFT JOIN people p ON p.id = r.assigned_to WHERE r.reference = ?').get(idOrRef)) as Row | undefined;
  if (!row) return null;
  return hydrate(row);
}

export function createRequest(input: ServiceRequestInput): ServiceRequest {
  const ts = now();
  const info = db.prepare(`INSERT INTO service_requests (reference, business_reference, title, status, priority, requested_by, contact_name, contact_email, contact_role, assigned_team, assigned_to, required_date, special_requirements, final_amount, currency, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.businessReference ?? null, input.title, input.status ?? 'Draft', input.priority ?? 'normal', input.requestedBy ?? 'system', input.contactName ?? null, input.contactEmail ?? null, input.contactRole ?? null, input.assignedTeam ?? null, input.assignedTo ?? null, input.requiredDate ?? null, input.specialRequirements ?? null, input.finalAmount ?? 0, input.currency ?? 'USD', input.notes ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `REQ-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE service_requests SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT r.*, p.name AS assigned_to_name FROM service_requests r LEFT JOIN people p ON p.id = r.assigned_to WHERE r.id = ?').get(id) as Row;
  return hydrate(row);
}

export function updateRequest(idOrRef: string, patch: Partial<ServiceRequestInput>): ServiceRequest {
  const existing = getRequestByIdOrRef(idOrRef);
  if (!existing) throw new Error('Request not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    businessReference: 'business_reference',
    title: 'title',
    status: 'status',
    priority: 'priority',
    requestedBy: 'requested_by',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
    contactRole: 'contact_role',
    assignedTeam: 'assigned_team',
    assignedTo: 'assigned_to',
    requiredDate: 'required_date',
    specialRequirements: 'special_requirements',
    finalAmount: 'final_amount',
    currency: 'currency',
    notes: 'notes',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return existing;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE service_requests SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getRequestByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update request');
  return updated;
}

export function deleteRequest(idOrRef: string): void {
  const existing = getRequestByIdOrRef(idOrRef);
  if (!existing) throw new Error('Request not found');
  db.prepare('DELETE FROM service_requests WHERE id = ?').run(existing.id);
}