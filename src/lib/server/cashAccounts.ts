import db from './db';
import type { CashAccount, CashTransaction } from '@/lib/types';

interface AccountRow {
  id: number;
  reference: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  account_number: string | null;
  bank_name: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface TransactionRow {
  id: number;
  reference: string;
  account_reference: string;
  type: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reconciled: number;
  transaction_date: string;
  created_at: string;
}

function now() { return new Date().toISOString(); }

function hydrateAccount(r: AccountRow): CashAccount {
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    type: r.type,
    currency: r.currency,
    balance: r.balance,
    accountNumber: r.account_number,
    bankName: r.bank_name,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function hydrateTransaction(r: TransactionRow): CashTransaction {
  return {
    id: r.id,
    reference: r.reference,
    accountReference: r.account_reference,
    type: r.type,
    amount: r.amount,
    description: r.description,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    reconciled: r.reconciled === 1,
    transactionDate: r.transaction_date,
    createdAt: r.created_at,
  };
}

export function listAccounts(filters: { search?: string; type?: string; limit?: number; page?: number } = {}): CashAccount[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.search) {
    conds.push('(name LIKE ? OR bank_name LIKE ?)');
    const q = `%${filters.search}%`;
    params.push(q, q);
  }
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM cash_accounts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as AccountRow[];
  return rows.map(hydrateAccount);
}

export function createAccount(input: { name: string; type?: string; currency?: string; balance?: number; accountNumber?: string | null; bankName?: string | null }): CashAccount {
  const ts = now();
  const info = db.prepare(`INSERT INTO cash_accounts (reference, name, type, currency, balance, account_number, bank_name, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.name, input.type ?? 'bank', input.currency ?? 'USD', input.balance ?? 0, input.accountNumber ?? null, input.bankName ?? null, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const ref = `ACC-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE cash_accounts SET reference = ? WHERE id = ?').run(ref, id);
  const row = db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(id) as AccountRow;
  return hydrateAccount(row);
}

export function updateAccount(idOrRef: string, patch: { name?: string; type?: string; currency?: string; balance?: number; accountNumber?: string | null; bankName?: string | null }): CashAccount {
  const isNum = /^\d+$/.test(idOrRef);
  const existing = (isNum ? db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM cash_accounts WHERE reference = ?').get(idOrRef)) as AccountRow | undefined;
  if (!existing) throw new Error('Account not found');
  const fields: string[] = [];
  const params: Record<string, unknown> = { id: existing.id };
  const map: Record<string, string> = {
    name: 'name',
    type: 'type',
    currency: 'currency',
    balance: 'balance',
    accountNumber: 'account_number',
    bankName: 'bank_name',
  };
  for (const [k, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      fields.push(`${col} = @${col}`);
      params[col] = (patch as Record<string, unknown>)[k] ?? null;
    }
  }
  if (!fields.length) return hydrateAccount(existing);
  fields.push('updated_at = @updated_at');
  params.updated_at = now();
  db.prepare(`UPDATE cash_accounts SET ${fields.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(existing.id) as AccountRow;
  return hydrateAccount(updated);
}

export function deleteAccount(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM cash_accounts WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM cash_accounts WHERE reference = ?').get(idOrRef)) as AccountRow | undefined;
  if (!row) throw new Error('Account not found');
  db.prepare('DELETE FROM cash_accounts WHERE id = ?').run(row.id);
}

export function listTransactions(filters: { accountReference?: string; type?: string; reconciled?: boolean; limit?: number; page?: number } = {}): CashTransaction[] {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (filters.accountReference) { conds.push('account_reference = ?'); params.push(filters.accountReference); }
  if (filters.type) { conds.push('type = ?'); params.push(filters.type); }
  if (filters.reconciled !== undefined) { conds.push('reconciled = ?'); params.push(filters.reconciled ? 1 : 0); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit ? Number(filters.limit) : 10;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`SELECT * FROM cash_transactions ${where} ORDER BY transaction_date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as TransactionRow[];
  return rows.map(hydrateTransaction);
}

export function createTransaction(input: { accountReference: string; type: string; amount: number; description?: string | null; referenceType?: string | null; referenceId?: string | null; transactionDate?: string }): CashTransaction {
  const ts = now();
  const info = db.prepare(`INSERT INTO cash_transactions (reference, account_reference, type, amount, description, reference_type, reference_id, reconciled, transaction_date, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', input.accountReference, input.type, input.amount, input.description ?? null, input.referenceType ?? null, input.referenceId ?? null, 0, input.transactionDate ?? ts.slice(0, 10), ts);
  const id = Number(info.lastInsertRowid);
  const ref = `TXN-${String(id).padStart(4, '0')}`;
  db.prepare('UPDATE cash_transactions SET reference = ? WHERE id = ?').run(ref, id);
  // Update account balance
  const multiplier = input.type === 'withdrawal' || input.type === 'payment' ? -1 : 1;
  db.prepare('UPDATE cash_accounts SET balance = balance + ? WHERE reference = ?').run(input.amount * multiplier, input.accountReference);
  const row = db.prepare('SELECT * FROM cash_transactions WHERE id = ?').get(id) as TransactionRow;
  return hydrateTransaction(row);
}

export function reconcileTransaction(idOrRef: string): CashTransaction {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM cash_transactions WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM cash_transactions WHERE reference = ?').get(idOrRef)) as TransactionRow | undefined;
  if (!row) throw new Error('Transaction not found');
  db.prepare('UPDATE cash_transactions SET reconciled = 1 WHERE id = ?').run(row.id);
  const updated = db.prepare('SELECT * FROM cash_transactions WHERE id = ?').get(row.id) as TransactionRow;
  return hydrateTransaction(updated);
}

export function deleteTransaction(idOrRef: string): void {
  const isNum = /^\d+$/.test(idOrRef);
  const row = (isNum ? db.prepare('SELECT * FROM cash_transactions WHERE id = ?').get(Number(idOrRef)) : db.prepare('SELECT * FROM cash_transactions WHERE reference = ?').get(idOrRef)) as TransactionRow | undefined;
  if (!row) throw new Error('Transaction not found');
  db.prepare('DELETE FROM cash_transactions WHERE id = ?').run(row.id);
}