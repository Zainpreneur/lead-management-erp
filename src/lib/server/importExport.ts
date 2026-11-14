import db from './db';
import type { ImportJob } from '@/lib/types';

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

export function parseCSV(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
  
  return { headers, rows };
}

export function importLeadsFromCSV(csv: string): { processed: number; errors: string[] } {
  const { headers, rows } = parseCSV(csv);
  const errors: string[] = [];
  let processed = 0;
  
  const ts = now();
  const tx = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const data: Record<string, string> = {};
        headers.forEach((h, idx) => { data[h] = row[idx] ?? ''; });
        
        const name = data.name || data.Name || '';
        if (!name) {
          errors.push(`Row ${i + 2}: Name is required`);
          continue;
        }
        
        const info = db.prepare(`INSERT INTO leads (reference, name, category, city, country, source, stage, priority, score, estimated_value, contact_name, contact_email, contact_phone, notes, assigned_to, assigned_team, reminder_days, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run('tmp', name, data.category || null, data.city || null, data.country || null, data.source || 'other', data.stage || 'new', data.priority || 'warm', Number(data.score) || 0, Number(data.estimatedValue) || Number(data.estimated_value) || 0, data.contactName || data.contact_name || null, data.contactEmail || data.contact_email || null, data.contactPhone || data.contact_phone || null, data.notes || null, null, null, 3, ts, ts);
        const id = Number(info.lastInsertRowid);
        const ref = `L-${String(id).padStart(4, '0')}`;
        db.prepare('UPDATE leads SET reference = ? WHERE id = ?').run(ref, id);
        db.prepare('INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)').run(id, 'created', 'Lead imported from CSV', null, 'system', ts);
        processed++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  });
  tx();
  
  return { processed, errors };
}

export function importCustomersFromCSV(csv: string): { processed: number; errors: string[] } {
  const { headers, rows } = parseCSV(csv);
  const errors: string[] = [];
  let processed = 0;
  
  const ts = now();
  const tx = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const data: Record<string, string> = {};
        headers.forEach((h, idx) => { data[h] = row[idx] ?? ''; });
        
        const name = data.name || data.Name || '';
        if (!name) {
          errors.push(`Row ${i + 2}: Name is required`);
          continue;
        }
        
        const info = db.prepare(`INSERT INTO customers (reference, lead_id, lead_reference, name, category, city, country, contact_name, contact_email, contact_phone, status, mrr, total_value, first_converted_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
          .run('tmp', null, data.leadReference || data.lead_reference || null, name, data.category || null, data.city || null, data.country || null, data.contactName || data.contact_name || null, data.contactEmail || data.contact_email || null, data.contactPhone || data.contact_phone || null, data.status || 'active', Number(data.mrr) || 0, Number(data.totalValue) || Number(data.total_value) || 0, ts, ts, ts);
        const id = Number(info.lastInsertRowid);
        const ref = `C-${String(id).padStart(4, '0')}`;
        db.prepare('UPDATE customers SET reference = ? WHERE id = ?').run(ref, id);
        processed++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  });
  tx();
  
  return { processed, errors };
}

export function listImportJobs(filters: { entityType?: string; status?: string; limit?: number; page?: number } = {}) {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.entityType) { conds.push('entity_type = ?'); params.push(filters.entityType); }
  if (filters.status) { conds.push('status = ?'); params.push(filters.status); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM import_jobs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as Array<{ id: number; reference: string; entity_type: string; file_name: string; status: string; total_rows: number; processed_rows: number; error_rows: number; errors: string | null; created_at: string; updated_at: string }>;
  return rows.map((r) => ({
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
  }));
}

export function createImportJob(input: { entityType: string; fileName: string; totalRows?: number }) {
  const ts = now();
  const info = db.prepare(`INSERT INTO import_jobs (reference, entity_type, file_name, status, total_rows, processed_rows, error_rows, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.entityType, input.fileName, 'pending', input.totalRows ?? 0, 0, 0, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `IMP-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE import_jobs SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(id) as { id: number; reference: string; entity_type: string; file_name: string; status: string; total_rows: number; processed_rows: number; error_rows: number; errors: string | null; created_at: string; updated_at: string };
  return {
    id: row.id,
    reference: row.reference,
    entityType: row.entity_type,
    fileName: row.file_name,
    status: row.status,
    totalRows: row.total_rows,
    processedRows: row.processed_rows,
    errorRows: row.error_rows,
    errors: row.errors,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updateImportJob(idOrRef: string, patch: { status?: string; totalRows?: number; processedRows?: number; errorRows?: number; errors?: string | null }) {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM import_jobs WHERE reference = ?').get(idOrRef)) as { id: number; reference: string } | undefined;
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
  if (!fields.length) return;
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE import_jobs SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const row = db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(existing.id) as { id: number; reference: string; entity_type: string; file_name: string; status: string; total_rows: number; processed_rows: number; error_rows: number; errors: string | null; created_at: string; updated_at: string };
  return {
    id: row.id,
    reference: row.reference,
    entityType: row.entity_type,
    fileName: row.file_name,
    status: row.status,
    totalRows: row.total_rows,
    processedRows: row.processed_rows,
    errorRows: row.error_rows,
    errors: row.errors,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deleteImportJob(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM import_jobs WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM import_jobs WHERE reference = ?').get(idOrRef)) as { id: number } | undefined;
  if (!row) throw new Error('Import job not found');
  db.prepare('DELETE FROM import_jobs WHERE id = ?').run(row.id);
}

export function processCSVImport(entityType: string, csv: string): { processed: number; errors: string[] } {
  if (entityType === 'leads') {
    return importLeadsFromCSV(csv);
  } else if (entityType === 'customers') {
    return importCustomersFromCSV(csv);
  }
  return { processed: 0, errors: ['Unsupported entity type'] };
}
// Excel export using xlsx
export async function exportLeadsXLSX(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const ws = XLSX.utils.json_to_sheet(leads);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportCustomersXLSX(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const ws = XLSX.utils.json_to_sheet(customers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportInvoicesXLSX(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const ws = XLSX.utils.json_to_sheet(invoices);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function exportExpensesXLSX(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all() as Array<Record<string, unknown>>;
  const ws = XLSX.utils.json_to_sheet(expenses);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
