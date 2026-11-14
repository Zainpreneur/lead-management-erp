import db from './db';
import type { HelpdeskTicket, TicketInput, TicketMessage } from '@/lib/types';

interface TicketRow {
  id: number;
  reference: string;
  business_reference: string | null;
  service_request_reference: string | null;
  subject: string;
  description: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  assigned_team: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  resolution: string | null;
  resolution_summary: string | null;
  sla_due_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: number;
  ticket_reference: string;
  author: string;
  author_role: string;
  visibility: string;
  body: string;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateTicket(r: TicketRow): HelpdeskTicket {
  return {
    id: r.id,
    reference: r.reference,
    businessReference: r.business_reference,
    serviceRequestReference: r.service_request_reference,
    subject: r.subject,
    description: r.description,
    type: r.type,
    category: r.category,
    priority: r.priority,
    status: r.status,
    assignedTeam: r.assigned_team,
    assignedTo: r.assigned_to,
    assignedToName: r.assigned_to_name,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    resolution: r.resolution,
    resolutionSummary: r.resolution_summary,
    slaDueAt: r.sla_due_at,
    resolvedAt: r.resolved_at,
    closedAt: r.closed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listTickets(filters: { search?: string; status?: string; priority?: string; businessReference?: string; limit?: number; page?: number } = {}): HelpdeskTicket[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(t.subject LIKE ? OR t.reference LIKE ? OR t.description LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.status) { conds.push('t.status = ?'); params.push(filters.status); }
  if (filters.priority) { conds.push('t.priority = ?'); params.push(filters.priority); }
  if (filters.businessReference) { conds.push('t.business_reference = ?'); params.push(filters.businessReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT t.*, p.name AS assigned_to_name FROM helpdesk_tickets t LEFT JOIN people p ON p.id = t.assigned_to ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TicketRow[];
  return rows.map(hydrateTicket);
}

export function getTicketByIdOrRef(idOrRef: string): HelpdeskTicket | null {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum
    ? db.prepare('SELECT t.*, p.name AS assigned_to_name FROM helpdesk_tickets t LEFT JOIN people p ON p.id = t.assigned_to WHERE t.id = ?').get(Number(idOrRef))
    : db.prepare('SELECT t.*, p.name AS assigned_to_name FROM helpdesk_tickets t LEFT JOIN people p ON p.id = t.assigned_to WHERE t.reference = ?').get(idOrRef)) as TicketRow | undefined;
  if (!row) return null;
  return hydrateTicket(row);
}

export function createTicket(input: TicketInput): HelpdeskTicket {
  const ts = now();
  const info = db.prepare(`INSERT INTO helpdesk_tickets (reference, business_reference, service_request_reference, subject, description, type, category, priority, status, assigned_team, assigned_to, contact_name, contact_email, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.businessReference ?? null, input.serviceRequestReference ?? null, input.subject, input.description, input.type ?? 'general', input.category ?? 'general', input.priority ?? 'normal', input.status ?? 'New', input.assignedTeam ?? null, input.assignedTo ?? null, input.contactName ?? null, input.contactEmail ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TKT-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE helpdesk_tickets SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT t.*, p.name AS assigned_to_name FROM helpdesk_tickets t LEFT JOIN people p ON p.id = t.assigned_to WHERE t.id = ?').get(id) as TicketRow;
  return hydrateTicket(row);
}

export function updateTicket(idOrRef: string, patch: Partial<TicketInput>): HelpdeskTicket {
  const existing = getTicketByIdOrRef(idOrRef);
  if (!existing) throw new Error('Ticket not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    businessReference: 'business_reference',
    serviceRequestReference: 'service_request_reference',
    subject: 'subject',
    description: 'description',
    type: 'type',
    category: 'category',
    priority: 'priority',
    status: 'status',
    assignedTeam: 'assigned_team',
    assignedTo: 'assigned_to',
    contactName: 'contact_name',
    contactEmail: 'contact_email',
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
  db.prepare(`UPDATE helpdesk_tickets SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = getTicketByIdOrRef(String(existing.id));
  if (!updated) throw new Error('Failed to update ticket');
  return updated;
}

export function deleteTicket(idOrRef: string): void {
  const existing = getTicketByIdOrRef(idOrRef);
  if (!existing) throw new Error('Ticket not found');
  db.prepare('DELETE FROM helpdesk_tickets WHERE id = ?').run(existing.id);
}

export function listTicketMessages(ticketRef: string): TicketMessage[] {
  const rows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_reference = ? ORDER BY created_at ASC').all(ticketRef) as MessageRow[];
  return rows.map((r) => ({
    id: r.id,
    ticketReference: r.ticket_reference,
    author: r.author,
    authorRole: r.author_role,
    visibility: r.visibility,
    body: r.body,
    createdAt: r.created_at,
  }));
}

export function createTicketMessage(input: { ticketReference: string; author: string; authorRole?: string; visibility?: string; body: string }): TicketMessage {
  const ts = now();
  const info = db.prepare(`INSERT INTO ticket_messages (ticket_reference, author, author_role, visibility, body, created_at) VALUES (?,?,?,?,?,?)`)
    .run(input.ticketReference, input.author, input.authorRole ?? 'agent', input.visibility ?? 'public', input.body, ts);
  const id = Number(info.lastInsertRowid);
  return {
    id,
    ticketReference: input.ticketReference,
    author: input.author,
    authorRole: input.authorRole ?? 'agent',
    visibility: input.visibility ?? 'public',
    body: input.body,
    createdAt: ts,
  };
}