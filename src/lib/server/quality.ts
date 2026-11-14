import db from './db';
import type { QualityInspection, QualityInspectionInput, NonConformanceReport, NCRInput } from '@/lib/types';

interface InspectionRow {
  id: number;
  reference: string;
  title: string;
  type: string;
  status: string;
  product_reference: string | null;
  vendor_reference: string | null;
  purchase_order_reference: string | null;
  inspector: string | null;
  result: string | null;
  notes: string | null;
  inspection_date: string;
  created_at: string;
  updated_at: string;
}

interface NCRRow {
  id: number;
  reference: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  inspection_reference: string | null;
  product_reference: string | null;
  vendor_reference: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateInspection(r: InspectionRow): QualityInspection {
  return {
    id: r.id,
    reference: r.reference,
    title: r.title,
    type: r.type,
    status: r.status,
    productReference: r.product_reference,
    vendorReference: r.vendor_reference,
    purchaseOrderReference: r.purchase_order_reference,
    inspector: r.inspector,
    result: r.result,
    notes: r.notes,
    inspectionDate: r.inspection_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateNCR(r: NCRRow): NonConformanceReport {
  return {
    id: r.id,
    reference: r.reference,
    title: r.title,
    description: r.description,
    severity: r.severity,
    status: r.status,
    inspectionReference: r.inspection_reference,
    productReference: r.product_reference,
    vendorReference: r.vendor_reference,
    assignedTo: r.assigned_to,
    assignedToName: r.assigned_to_name,
    resolution: r.resolution,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Inspections
export function listInspections(filters: { search?: string; status?: string; type?: string; limit?: number; page?: number } = {}): QualityInspection[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(title LIKE ? OR reference LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM quality_inspections ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as InspectionRow[];
  return rows.map(hydrateInspection);
}

export function createInspection(input: QualityInspectionInput): QualityInspection {
  const ts = now();
  const info = db.prepare(`INSERT INTO quality_inspections (reference, title, type, status, product_reference, vendor_reference, purchase_order_reference, inspector, result, notes, inspection_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.title, input.type ?? 'incoming', input.status ?? 'pending', input.productReference ?? null, input.vendorReference ?? null, input.purchaseOrderReference ?? null, input.inspector ?? null, input.result ?? null, input.notes ?? null, input.inspectionDate ?? ts.slice(0, 10), ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `QI-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE quality_inspections SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(id) as InspectionRow;
  return hydrateInspection(row);
}

export function updateInspection(idOrRef: string, patch: Partial<QualityInspectionInput>): QualityInspection {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM quality_inspections WHERE reference = ?').get(idOrRef)) as InspectionRow | undefined;
  if (!existing) throw new Error('Inspection not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { title: 'title', type: 'type', status: 'status', productReference: 'product_reference', vendorReference: 'vendor_reference', purchaseOrderReference: 'purchase_order_reference', inspector: 'inspector', result: 'result', notes: 'notes', inspectionDate: 'inspection_date' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateInspection(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE quality_inspections SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(existing.id) as InspectionRow;
  return hydrateInspection(updated);
}

export function deleteInspection(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM quality_inspections WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM quality_inspections WHERE reference = ?').get(idOrRef)) as InspectionRow | undefined;
  if (!row) throw new Error('Inspection not found');
  db.prepare('DELETE FROM quality_inspections WHERE id = ?').run(row.id);
}

// NCRs
export function listNCRs(filters: { search?: string; status?: string; severity?: string; limit?: number; page?: number } = {}): NonConformanceReport[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(title LIKE ? OR description LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  if (filters.severity) { conds.push('severity = ?'); params.push(filters.severity); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT n.*, p.name AS assigned_to_name FROM non_conformance_reports n LEFT JOIN people p ON p.id = n.assigned_to ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as NCRRow[];
  return rows.map(hydrateNCR);
}

export function createNCR(input: NCRInput): NonConformanceReport {
  const ts = now();
  const info = db.prepare(`INSERT INTO non_conformance_reports (reference, title, description, severity, status, inspection_reference, product_reference, vendor_reference, assigned_to, resolution, resolved_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.title, input.description, input.severity ?? 'minor', input.status ?? 'open', input.inspectionReference ?? null, input.productReference ?? null, input.vendorReference ?? null, input.assignedTo ?? null, input.resolution ?? null, null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `NCR-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE non_conformance_reports SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT n.*, p.name AS assigned_to_name FROM non_conformance_reports n LEFT JOIN people p ON p.id = n.assigned_to WHERE n.id = ?').get(id) as NCRRow;
  return hydrateNCR(row);
}

export function updateNCR(idOrRef: string, patch: Partial<NCRInput>): NonConformanceReport {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM non_conformance_reports WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM non_conformance_reports WHERE reference = ?').get(idOrRef)) as NCRRow | undefined;
  if (!existing) throw new Error('NCR not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { title: 'title', description: 'description', severity: 'severity', status: 'status', inspectionReference: 'inspection_reference', productReference: 'product_reference', vendorReference: 'vendor_reference', assignedTo: 'assigned_to', resolution: 'resolution' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'status') && patch.status === 'resolved') {
    fields.push('resolved_at = @resolved_at');
    params.resolved_at = now();
  }
  if (!fields.length) return hydrateNCR(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE non_conformance_reports SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT n.*, p.name AS assigned_to_name FROM non_conformance_reports n LEFT JOIN people p ON p.id = n.assigned_to WHERE n.id = ?').get(existing.id) as NCRRow;
  return hydrateNCR(updated);
}

export function deleteNCR(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM non_conformance_reports WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM non_conformance_reports WHERE reference = ?').get(idOrRef)) as NCRRow | undefined;
  if (!row) throw new Error('NCR not found');
  db.prepare('DELETE FROM non_conformance_reports WHERE id = ?').run(row.id);
}