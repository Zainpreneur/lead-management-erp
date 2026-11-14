import db from './db';
import type { TaxRate, Currency } from '@/lib/types';

interface TaxRateRow {
  id: number;
  reference: string;
  name: string;
  rate: number;
  type: string;
  is_default: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface CurrencyRow {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateTaxRate(r: TaxRateRow): TaxRate {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    rate: r.rate,
    type: r.type,
    isDefault: r.is_default === 1,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateCurrency(r: CurrencyRow): Currency {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    symbol: r.symbol,
    exchangeRate: r.exchange_rate,
    isDefault: r.is_default === 1,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// Tax Rates
export function listTaxRates(filters: { search?: string; type?: string; limit?: number; page?: number } = {}): TaxRate[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q);
  }
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM tax_rates ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TaxRateRow[];
  return rows.map(hydrateTaxRate);
}

export function createTaxRate(input: { name: string; rate: number; type?: string; isDefault?: boolean }): TaxRate {
  const ts = now();
  const info = db.prepare(`INSERT INTO tax_rates (reference, name, rate, type, is_default, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.rate, input.type ?? 'vat', input.isDefault ? 1 : 0, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TAX-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE tax_rates SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM tax_rates WHERE id = ?').get(id) as TaxRateRow;
  return hydrateTaxRate(row);
}

export function updateTaxRate(idOrRef: string, patch: { name?: string; rate?: number; type?: string; isDefault?: boolean }): TaxRate {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM tax_rates WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM tax_rates WHERE reference = ?').get(idOrRef)) as TaxRateRow | undefined;
  if (!existing) throw new Error('Tax rate not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = { name: 'name', rate: 'rate', type: 'type', isDefault: 'is_default' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateTaxRate(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE tax_rates SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM tax_rates WHERE id = ?').get(existing.id) as TaxRateRow;
  return hydrateTaxRate(updated);
}

export function deleteTaxRate(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM tax_rates WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM tax_rates WHERE reference = ?').get(idOrRef)) as TaxRateRow | undefined;
  if (!row) throw new Error('Tax rate not found');
  db.prepare('DELETE FROM tax_rates WHERE id = ?').run(row.id);
}

// Currencies
export function listCurrencies(filters: { search?: string; limit?: number; page?: number } = {}): Currency[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(code LIKE ? OR name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM currencies ${where} ORDER BY code ASC LIMIT ? OFFSET ?`).all(...params, limit, offset) as CurrencyRow[];
  return rows.map(hydrateCurrency);
}

export function createCurrency(input: { code: string; name: string; symbol: string; exchangeRate?: number; isDefault?: boolean }): Currency {
  const ts = now();
  const info = db.prepare(`INSERT INTO currencies (code, name, symbol, exchange_rate, is_default, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(input.code, input.name, input.symbol, input.exchangeRate ?? 1, input.isDefault ? 1 : 0, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM currencies WHERE id = ?').get(id) as CurrencyRow;
  return hydrateCurrency(row);
}

export function updateCurrency(code: string, patch: { name?: string; symbol?: string; exchangeRate?: number; isDefault?: boolean }): Currency {
  const existing = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code) as CurrencyRow | undefined;
  if (!existing) throw new Error('Currency not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { code };
  const map: Record<string, string> = { name: 'name', symbol: 'symbol', exchangeRate: 'exchange_rate', isDefault: 'is_default' };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateCurrency(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE currencies SET ${fields.join(', ')} WHERE code = @code`).run(params);
  const updated = db.prepare('SELECT * FROM currencies WHERE code = ?').get(code) as CurrencyRow;
  return hydrateCurrency(updated);
}

export function deleteCurrency(code: string): void {
  db.prepare('DELETE FROM currencies WHERE code = ?').run(code);
}