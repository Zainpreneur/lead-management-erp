import db from './db';

interface BranchRow {
  id: number;
  reference: string;
  business_reference: string;
  code: string | null;
  name: string;
  kind: string;
  status: string;
  location: string | null;
  address: string | null;
  currency: string;
  timezone: string;
  is_primary: number;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrate(r: BranchRow) {
  return {
    id: r.id,
    reference: r.reference,
    businessReference: r.business_reference,
    code: r.code,
    name: r.name,
    kind: r.kind,
    status: r.status,
    location: r.location,
    address: r.address,
    currency: r.currency,
    timezone: r.timezone,
    isPrimary: r.is_primary === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function listBranches(businessRef: string) {
  const rows = db.prepare('SELECT * FROM business_branches WHERE business_reference = ? ORDER BY is_primary DESC, created_at').all(businessRef) as BranchRow[];
  return rows.map(hydrate);
}

export function createBranch(input: {
  businessReference: string;
  code?: string | null;
  name: string;
  kind?: string;
  status?: string;
  location?: string | null;
  address?: string | null;
  currency?: string;
  timezone?: string;
  isPrimary?: boolean;
}) {
  const ts = now();
  const info = db.prepare(`INSERT INTO business_branches (reference, business_reference, code, name, kind, status, location, address, currency, timezone, is_primary, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.businessReference, input.code ?? null, input.name, input.kind ?? 'branch', input.status ?? 'active', input.location ?? null, input.address ?? null, input.currency ?? 'USD', input.timezone ?? 'UTC', input.isPrimary ? 1 : 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `BR-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE business_branches SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM business_branches WHERE id = ?').get(id) as BranchRow;
  return hydrate(row);
}

export function deleteBranch(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM business_branches WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM business_branches WHERE reference = ?').get(idOrRef)) as BranchRow | undefined;
  if (!row) throw new Error('Branch not found');
  db.prepare('DELETE FROM business_branches WHERE id = ?').run(row.id);
}