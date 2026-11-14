import db from './db';
import type { Tag, TagInput, EntityTag } from '@/lib/types';

interface TagRow {
  id: number;
  reference: string;
  name: string;
  slug: string;
  color: string;
  entity_type: string | null;
  created_at: string;
  updated_at: string;
}

interface EntityTagRow {
  id: number;
  tag_reference: string;
  entity_type: string;
  entity_reference: string;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function hydrateTag(r: TagRow): Tag {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    slug: r.slug,
    color: r.color,
    entityType: r.entity_type,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listTags(filters: { search?: string; entityType?: string; limit?: number; page?: number } = {}): Tag[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ? OR slug LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.entityType) { conds.push('entity_type = ?'); params.push(filters.entityType); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM tags ${where} ORDER BY name ASC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TagRow[];
  return rows.map(hydrateTag);
}

export function createTag(input: TagInput): Tag {
  const ts = now();
  const slug = input.slug || slugify(input.name);
  const info = db.prepare(`INSERT INTO tags (reference, name, slug, color, entity_type, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`)
    .run('tmp', input.name, slug, input.color ?? '#6366f1', input.entityType ?? null, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TAG-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE tags SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow;
  return hydrateTag(row);
}

export function deleteTag(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM tags WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM tags WHERE reference = ?').get(idOrRef)) as TagRow | undefined;
  if (!row) throw new Error('Tag not found');
  db.prepare('DELETE FROM tags WHERE id = ?').run(row.id);
}

export function addTagToEntity(tagRef: string, entityType: string, entityRef: string): void {
  const ts = now();
  db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_reference, entity_type, entity_reference, created_at) VALUES (?,?,?,?)`)
    .run(tagRef, entityType, entityRef, ts);
}

export function removeTagFromEntity(tagRef: string, entityType: string, entityRef: string): void {
  db.prepare('DELETE FROM entity_tags WHERE tag_reference = ? AND entity_type = ? AND entity_reference = ?')
    .run(tagRef, entityType, entityRef);
}

export function getEntityTags(entityType: string, entityRef: string): Tag[] {
  const rows = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_reference = t.reference WHERE et.entity_type = ? AND et.entity_reference = ? ORDER BY t.name`).all(entityType, entityRef) as TagRow[];
  return rows.map(hydrateTag);
}

export function getEntitiesByTag(tagRef: string, entityType?: string): Array<{ entityType: string; entityReference: string }> {
  const conds = ['tag_reference = ?'];
  const params: unknown[] = [tagRef];
  if (entityType) { conds.push('entity_type = ?'); params.push(entityType); }
  const rows = db.prepare(`SELECT entity_type, entity_reference FROM entity_tags WHERE ${conds.join(' AND ')} ORDER BY created_at DESC`).all(...params) as Array<{ entity_type: string; entity_reference: string }>;
  return rows.map((r) => ({ entityType: r.entity_type, entityReference: r.entity_reference }));
}