import db from './db';
import type { Document, DocumentInput } from '@/lib/types';

interface DocRow {
  id: number;
  reference: string;
  name: string;
  file_name: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  entity_type: string;
  entity_reference: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrate(r: DocRow): Document {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileSize: r.file_size,
    mimeType: r.mime_type,
    entityType: r.entity_type,
    entityReference: r.entity_reference,
    uploadedBy: r.uploaded_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listDocuments(filters: { entityType?: string; entityReference?: string; limit?: number; page?: number } = {}): Document[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.entityType) { conds.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters.entityReference) { conds.push('entity_reference = ?'); params.push(filters.entityReference); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM documents ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as DocRow[];
  return rows.map(hydrate);
}

export function createDocument(input: DocumentInput): Document {
  const ts = now();
  const info = db.prepare(`INSERT INTO documents (reference, name, file_name, file_url, file_size, mime_type, entity_type, entity_reference, uploaded_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.fileName, input.fileUrl ?? null, input.fileSize ?? null, input.mimeType ?? null, input.entityType, input.entityReference, input.uploadedBy ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `DOC-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE documents SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocRow;
  return hydrate(row);
}



export function updateDocument(idOrRef: string, patch: { name?: string; fileName?: string; fileUrl?: string | null; fileSize?: number | null; mimeType?: string | null; entityType?: string; entityReference?: string }): Document {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM documents WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM documents WHERE reference = ?').get(idOrRef)) as DocRow | undefined;
  if (!existing) throw new Error('Document not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', fileName: 'file_name', fileUrl: 'file_url', fileSize: 'file_size', mimeType: 'mime_type', entityType: 'entity_type', entityReference: 'entity_reference' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrate(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(existing.id) as DocRow;
  return hydrate(updated);
}

export function deleteDocument(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM documents WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM documents WHERE reference = ?').get(idOrRef)) as DocRow | undefined;
  if (!row) throw new Error('Document not found');
  db.prepare('DELETE FROM documents WHERE id = ?').run(row.id);
}