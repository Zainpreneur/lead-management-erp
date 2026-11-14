import db from './db';

interface SyncQueueRow {
  id: number;
  entity_type: string;
  entity_reference: string;
  action: string;
  payload: string;
  status: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

interface SnapshotRow {
  id: number;
  entity_type: string;
  entity_reference: string;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

export function enqueueSync(entityType: string, entityRef: string, action: string, payload: Record<string, unknown> = {}) {
  const ts = now();
  db.prepare(`INSERT INTO sync_queue (entity_type, entity_reference, action, payload, status, retry_count, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(entityType, entityRef, action, JSON.stringify(payload), 'pending', 0, ts, ts);
}

export function listPendingSyncs(limit: number = 50) {
  const rows = db.prepare(`SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?`).all(limit) as SyncQueueRow[];
  return rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityReference: r.entity_reference,
    action: r.action,
    payload: JSON.parse(r.payload),
    status: r.status,
    retryCount: r.retry_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function markSyncProcessed(id: number): void {
  const ts = now();
  db.prepare(`UPDATE sync_queue SET status = 'processed', updated_at = ? WHERE id = ?`).run(ts, id);
}

export function markSyncFailed(id: number): void {
  const ts = now();
  db.prepare(`UPDATE sync_queue SET status = 'failed', retry_count = retry_count + 1, updated_at = ? WHERE id = ?`).run(ts, id);
}

export function saveSnapshot(entityType: string, entityRef: string, data: Record<string, unknown>, version: number = 1) {
  const ts = now();
  db.prepare(`INSERT INTO offline_snapshots (entity_type, entity_reference, data, version, created_at, updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(entity_type, entity_reference) DO UPDATE SET data = ?, version = ?, updated_at = ?`)
    .run(entityType, entityRef, JSON.stringify(data), version, ts, ts, JSON.stringify(data), version, ts);
}

export function getSnapshot(entityType: string, entityRef: string) {
  const row = db.prepare('SELECT * FROM offline_snapshots WHERE entity_type = ? AND entity_reference = ?').get(entityType, entityRef) as SnapshotRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    entityType: row.entity_type,
    entityReference: row.entity_reference,
    data: JSON.parse(row.data),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listSnapshots(entityType?: string, limit: number = 50) {
  const where = entityType ? 'WHERE entity_type = ?' : '';
  const params = entityType ? [entityType] : [];
  const rows = db.prepare(`SELECT * FROM offline_snapshots ${where} ORDER BY updated_at DESC LIMIT ?`).all(...params, limit) as SnapshotRow[];
  return rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityReference: r.entity_reference,
    data: JSON.parse(r.data),
    version: r.version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getSyncStats() {
  const pending = (db.prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status = 'pending'").get() as { c: number }).c;
  const failed = (db.prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status = 'failed'").get() as { c: number }).c;
  const processed = (db.prepare("SELECT COUNT(*) as c FROM sync_queue WHERE status = 'processed'").get() as { c: number }).c;
  const snapshots = (db.prepare('SELECT COUNT(*) as c FROM offline_snapshots').get() as { c: number }).c;
  return { pending, failed, processed, snapshots };
}