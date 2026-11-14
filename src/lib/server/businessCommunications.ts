import db from './db';

interface CommRow {
  id: number;
  business_reference: string;
  contact_id: number | null;
  kind: string;
  subject: string;
  body: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  created_by: string | null;
}

function now() { return new Date().toISOString(); }

function hydrate(r: CommRow) {
  return {
    id: r.id,
    businessReference: r.business_reference,
    contactId: r.contact_id,
    kind: r.kind,
    subject: r.subject,
    body: r.body,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    createdAt: r.created_at,
    createdBy: r.created_by,
  };
}

export function listCommunications(businessRef: string) {
  const rows = db.prepare('SELECT * FROM business_communications WHERE business_reference = ? ORDER BY created_at DESC').all(businessRef) as CommRow[];
  return rows.map(hydrate);
}

export function createCommunication(input: {
  businessReference: string;
  contactId?: number | null;
  kind?: string;
  subject: string;
  body?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdBy?: string | null;
}) {
  const ts = now();
  const info = db.prepare(`INSERT INTO business_communications (business_reference, contact_id, kind, subject, body, contact_name, contact_email, contact_phone, created_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(input.businessReference, input.contactId ?? null, input.kind ?? 'note', input.subject, input.body ?? null, input.contactName ?? null, input.contactEmail ?? null, input.contactPhone ?? null, ts, input.createdBy ?? null);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM business_communications WHERE id = ?').get(id) as CommRow;
  return hydrate(row);
}

export function deleteCommunication(id: number): void {
  db.prepare('DELETE FROM business_communications WHERE id = ?').run(id);
}