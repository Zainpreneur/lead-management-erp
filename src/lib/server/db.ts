import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.join('/tmp', 'leads.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create ALL tables first
db.exec(`
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  team TEXT,
  role TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  city TEXT,
  country TEXT,
  source TEXT NOT NULL DEFAULT 'other',
  stage TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'warm',
  score INTEGER NOT NULL DEFAULT 0,
  estimated_value REAL NOT NULL DEFAULT 0,
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  social TEXT,
  notes TEXT,
  assigned_to INTEGER,
  assigned_team TEXT,
  follow_up_date TEXT,
  last_contacted_at TEXT,
  reminder_days INTEGER NOT NULL DEFAULT 3,
  converted_at TEXT,
  lost_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  actor TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL,
  FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  lead_id INTEGER,
  lead_reference TEXT,
  name TEXT NOT NULL,
  category TEXT,
  city TEXT,
  country TEXT,
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  social TEXT,
  notes TEXT,
  assigned_to INTEGER,
  assigned_team TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  mrr REAL NOT NULL DEFAULT 0,
  total_value REAL NOT NULL DEFAULT 0,
  first_converted_at TEXT NOT NULL,
  last_activity_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(assigned_to) REFERENCES people(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS customer_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT,
  actor TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL,
  FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  customer_reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  lead_reference TEXT,
  proposal_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  paid_date TEXT,
  notes TEXT,
  terms TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_reference) REFERENCES customers(reference)
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_reference TEXT NOT NULL,
  product_reference TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_percent REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(invoice_reference) REFERENCES invoices(reference) ON DELETE CASCADE,
  FOREIGN KEY(product_reference) REFERENCES products(reference)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  invoice_reference TEXT NOT NULL,
  customer_reference TEXT,
  amount REAL NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(invoice_reference) REFERENCES invoices(reference)
);

CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  lead_reference TEXT,
  customer_reference TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  discount_type TEXT,
  discount_value REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  valid_until TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(lead_reference) REFERENCES leads(reference),
  FOREIGN KEY(customer_reference) REFERENCES customers(reference)
);

CREATE TABLE IF NOT EXISTS proposal_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_reference TEXT NOT NULL,
  product_reference TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(proposal_reference) REFERENCES proposals(reference) ON DELETE CASCADE,
  FOREIGN KEY(product_reference) REFERENCES products(reference)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_type TEXT,
  related_reference TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  type TEXT NOT NULL DEFAULT 'service',
  price REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  customer_reference TEXT,
  account_name TEXT,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(customer_reference) REFERENCES customers(reference)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  expense_date TEXT NOT NULL,
  paid_by TEXT,
  notes TEXT,
  receipt_url TEXT,
  vendor_reference TEXT,
  asset_reference TEXT,
  purchase_order_reference TEXT,
  asset_category TEXT,
  is_asset_purchase INTEGER NOT NULL DEFAULT 0,
  asset_depreciation_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);

// Now seed ALL data after tables exist
function now() { return new Date().toISOString(); }

const peopleCount = (db.prepare('SELECT COUNT(*) AS c FROM people').get() as { c: number }).c;
if (peopleCount === 0) {
  const insert = db.prepare('INSERT INTO people (code, name, email, phone, team, role, is_active) VALUES (?,?,?,?,?,?,1)');
  const seed = [
    ['P-001', 'Alice Johnson', 'alice@example.com', '+1-555-0101', 'Sales', 'Account Executive'],
    ['P-002', 'Bob Smith', 'bob@example.com', '+1-555-0102', 'Sales', 'Sales Rep'],
    ['P-003', 'Carol Davis', 'carol@example.com', '+1-555-0103', 'Marketing', 'Lead Gen'],
    ['P-004', 'David Lee', 'david@example.com', '+1-555-0104', 'Support', 'Customer Success'],
  ];
  const tx = db.transaction(() => { for (const p of seed) insert.run(...p); });
  tx();
}

const leadsCount = (db.prepare('SELECT COUNT(*) AS c FROM leads').get() as { c: number }).c;
if (leadsCount === 0) {
  const insertLead = db.prepare(`
    INSERT INTO leads (reference, name, category, city, country, source, stage, priority, score, estimated_value,
      contact_name, contact_email, assigned_to, assigned_team, reminder_days, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertActivity = db.prepare('INSERT INTO lead_activities (lead_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)');
  const ts = now();
  const samples = [
    ['L-0001', 'Acme Corp', 'Software', 'New York', 'USA', 'referral', 'qualified', 'hot', 85, 12000, 'John Doe', 'john@acme.com', 1, 'Sales', 3],
    ['L-0002', 'Globex Inc', 'Manufacturing', 'Chicago', 'USA', 'website', 'contacted', 'warm', 60, 8000, 'Jane Smith', 'jane@globex.com', 2, 'Sales', 5],
    ['L-0003', 'Initech', 'Consulting', 'Austin', 'USA', 'linkedin', 'new', 'cold', 30, 3000, 'Peter Gibbons', 'peter@initech.com', null, null, 7],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = insertLead.run(...s, ts, ts);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE leads SET reference = ? WHERE id = ?').run(s[0], id);
      insertActivity.run(id, 'created', 'Lead created', null, 'system', ts);
    }
  });
  tx();
}

const customersCount = (db.prepare('SELECT COUNT(*) AS c FROM customers').get() as { c: number }).c;
if (customersCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO customers (reference, lead_id, lead_reference, name, category, city, country, contact_name, contact_email, assigned_to, assigned_team, status, mrr, total_value, first_converted_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['C-0001', null, 'L-0001', 'Acme Corp', 'Software', 'New York', 'USA', 'John Doe', 'john@acme.com', 1, 'Sales', 'active', 500, 12000, ts, ts, ts],
    ['C-0002', null, 'L-0002', 'Globex Inc', 'Manufacturing', 'Chicago', 'USA', 'Jane Smith', 'jane@globex.com', 2, 'Sales', 'active', 300, 8000, ts, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE customers SET reference = ? WHERE id = ?').run(s[0], id);
      db.prepare('INSERT INTO customer_activities (customer_id, kind, summary, outcome, actor, created_at) VALUES (?,?,?,?,?,?)').run(id, 'created', 'Customer created', null, 'system', ts);
    }
  });
  tx();
}

const invoicesCount = (db.prepare('SELECT COUNT(*) AS c FROM invoices').get() as { c: number }).c;
if (invoicesCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO invoices (reference, customer_reference, customer_name, status, subtotal, tax_amount, discount_amount, total_amount, currency, issue_date, due_date, notes, terms, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['INV-0001', 'C-0001', 'Acme Corp', 'sent', 12000, 1200, 0, 13200, 'USD', ts.slice(0,10), ts.slice(0,10), 'Initial invoice', 'Net 30', ts, ts],
    ['INV-0002', 'C-0002', 'Globex Inc', 'draft', 8000, 800, 0, 8800, 'USD', ts.slice(0,10), ts.slice(0,10), 'Draft invoice', 'Net 30', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE invoices SET reference = ? WHERE id = ?').run(s[0], id);
      db.prepare(`INSERT INTO invoice_line_items (invoice_reference, product_reference, description, quantity, unit_price, discount_percent, discount_amount, tax_rate, tax_amount, line_total, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(s[0], null, 'Consulting services', 1, s[4] as number, 0, 0, 10, s[5] as number, (s[4] as number)+(s[5] as number), 0, ts, ts);
    }
  });
  tx();
}

const paymentsCount = (db.prepare('SELECT COUNT(*) AS c FROM payments').get() as { c: number }).c;
if (paymentsCount === 0) {
  const ts = now();
  db.prepare(`INSERT INTO payments (reference, invoice_reference, customer_reference, amount, method, status, paid_at, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run('PAY-0001', 'INV-0001', 'C-0001', 5000, 'bank_transfer', 'completed', ts.slice(0,10), 'Partial payment', ts);
}

const proposalsCount = (db.prepare('SELECT COUNT(*) AS c FROM proposals').get() as { c: number }).c;
if (proposalsCount === 0) {
  const ts = now();
  const info = db.prepare(`INSERT INTO proposals (reference, lead_reference, customer_reference, title, status, subtotal, discount_type, discount_value, total, currency, valid_until, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', 'L-0001', 'C-0001', 'Acme Proposal', 'sent', 10000, null, 0, 10000, 'USD', ts.slice(0,10), 'Proposal notes', ts, ts);
  const id = Number(info.lastInsertRowid);
  db.prepare('UPDATE proposals SET reference = ? WHERE id = ?').run('PROP-0001', id);
  db.prepare('INSERT INTO proposal_lines (proposal_reference, product_reference, description, quantity, unit_price, line_total, sort_order) VALUES (?,?,?,?,?,?,?)')
    .run('PROP-0001', null, 'Implementation', 1, 10000, 10000, 0);
}

const tasksCount = (db.prepare('SELECT COUNT(*) AS c FROM tasks').get() as { c: number }).c;
if (tasksCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO tasks (reference, title, description, related_type, related_reference, due_date, status, priority, assigned_to, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['TASK-0001', 'Follow up with Acme', 'Call John Doe', 'lead', 'L-0001', ts.slice(0,10), 'open', 'high', 1, ts, ts],
    ['TASK-0002', 'Send invoice reminder', 'Remind Globex', 'invoice', 'INV-0002', ts.slice(0,10), 'open', 'medium', 2, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE tasks SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

const productsCount = (db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number }).c;
if (productsCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO products (reference, name, sku, type, price, cost, stock, status, description, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['PROD-0001', 'Consulting Service', 'CONSULT-01', 'service', 5000, 0, 999, 'active', 'Professional consulting', ts, ts],
    ['PROD-0002', 'Software License', 'SW-LIC-01', 'product', 299, 0, 100, 'active', 'Annual license', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE products SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

const contactsCount = (db.prepare('SELECT COUNT(*) AS c FROM contacts').get() as { c: number }).c;
if (contactsCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO contacts (reference, customer_reference, account_name, name, role, email, phone, is_primary, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['CONT-0001', 'C-0001', 'Acme Corp', 'John Doe', 'CTO', 'john@acme.com', '+1-555-1001', 1, ts, ts],
    ['CONT-0002', 'C-0002', 'Globex Inc', 'Jane Smith', 'VP Engineering', 'jane@globex.com', '+1-555-2002', 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE contacts SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

const expensesCount = (db.prepare('SELECT COUNT(*) AS c FROM expenses').get() as { c: number }).c;
if (expensesCount === 0) {
  const ts = now();
  const ins = db.prepare(`INSERT INTO expenses (reference, title, category, amount, currency, status, expense_date, paid_by, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['EXP-0001', 'Team lunch', 'meals', 120, 'USD', 'approved', ts.slice(0,10), 'Alice', 'Team lunch', ts, ts],
    ['EXP-0002', 'Software subscription', 'software', 49, 'USD', 'paid', ts.slice(0,10), 'Bob', 'SaaS tool', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE expenses SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}


db.exec(`
CREATE TABLE IF NOT EXISTS business_branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  business_reference TEXT NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'branch',
  status TEXT NOT NULL DEFAULT 'active',
  location TEXT,
  address TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(business_reference) REFERENCES customers(reference) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_reference TEXT NOT NULL,
  contact_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'note',
  subject TEXT NOT NULL,
  body TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TEXT NOT NULL,
  created_by TEXT,
  FOREIGN KEY(business_reference) REFERENCES customers(reference) ON DELETE CASCADE,
  FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  business_reference TEXT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  priority TEXT NOT NULL DEFAULT 'normal',
  requested_by TEXT NOT NULL DEFAULT 'system',
  contact_name TEXT,
  contact_email TEXT,
  contact_role TEXT,
  assigned_team TEXT,
  assigned_to INTEGER,
  required_date TEXT,
  special_requirements TEXT,
  final_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(business_reference) REFERENCES customers(reference),
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  business_reference TEXT,
  service_request_reference TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'New',
  assigned_team TEXT,
  assigned_to INTEGER,
  contact_name TEXT,
  contact_email TEXT,
  resolution TEXT,
  resolution_summary TEXT,
  sla_due_at TEXT,
  resolved_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(business_reference) REFERENCES customers(reference),
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_reference TEXT NOT NULL,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'agent',
  visibility TEXT NOT NULL DEFAULT 'public',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(ticket_reference) REFERENCES helpdesk_tickets(reference) ON DELETE CASCADE
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  team TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);


// Seed default admin user if no users exist
const usersCount = (db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }).c;
if (usersCount === 0) {
  const ts = new Date().toISOString();

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');
  const passwordHash = `${salt}:${hash}`;
  db.prepare(`INSERT INTO users (email, name, password_hash, role, team, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run('admin@example.com', 'Admin User', passwordHash, 'admin', 'Administration', 1, ts, ts);
}


db.exec(`
CREATE TABLE IF NOT EXISTS cash_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank',
  currency TEXT NOT NULL DEFAULT 'USD',
  balance REAL NOT NULL DEFAULT 0,
  account_number TEXT,
  bank_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  account_reference TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit',
  amount REAL NOT NULL DEFAULT 0,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  reconciled INTEGER NOT NULL DEFAULT 0,
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(account_reference) REFERENCES cash_accounts(reference)
);
`);


// Seed demo cash accounts if empty
const cashAccountsCount = (db.prepare('SELECT COUNT(*) AS c FROM cash_accounts').get() as { c: number }).c;
if (cashAccountsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO cash_accounts (reference, name, type, currency, balance, account_number, bank_name, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['ACC-0001', 'Main Business Checking', 'bank', 'USD', 50000, '1234567890', 'Chase Bank', 1, ts, ts],
    ['ACC-0002', 'Petty Cash', 'cash', 'USD', 500, null, null, 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE cash_accounts SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}


db.exec(`
CREATE TABLE IF NOT EXISTS tax_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rate REAL NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'vat',
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate REAL NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);


// Seed demo tax rates if empty
const taxRatesCount = (db.prepare('SELECT COUNT(*) AS c FROM tax_rates').get() as { c: number }).c;
if (taxRatesCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO tax_rates (reference, name, rate, type, is_default, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['TAX-0001', 'Standard VAT', 10, 'vat', 1, 1, ts, ts],
    ['TAX-0002', 'GST', 18, 'gst', 0, 1, ts, ts],
    ['TAX-0003', 'Zero Rate', 0, 'vat', 0, 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE tax_rates SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo currencies if empty
const currenciesCount = (db.prepare('SELECT COUNT(*) AS c FROM currencies').get() as { c: number }).c;
if (currenciesCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO currencies (code, name, symbol, exchange_rate, is_default, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['USD', 'US Dollar', '$', 1, 1, 1, ts, ts],
    ['EUR', 'Euro', '€', 0.92, 0, 1, ts, ts],
    ['GBP', 'British Pound', '£', 0.79, 0, 1, ts, ts],
    ['INR', 'Indian Rupee', '₹', 83.5, 0, 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      ins.run(...s);
    }
  });
  tx();
}


db.exec(`
CREATE TABLE IF NOT EXISTS financial_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  entity_type TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  uploaded_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  kind TEXT NOT NULL DEFAULT 'supplier',
  status TEXT NOT NULL DEFAULT 'active',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  notes TEXT,
  rating REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  vendor_reference TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  order_date TEXT NOT NULL,
  expected_delivery TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_reference TEXT NOT NULL,
  product_reference TEXT,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  line_total REAL NOT NULL DEFAULT 0,
  received_quantity REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(po_reference) REFERENCES purchase_orders(reference) ON DELETE CASCADE,
  FOREIGN KEY(product_reference) REFERENCES products(reference)
);

CREATE TABLE IF NOT EXISTS goods_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  po_reference TEXT NOT NULL,
  vendor_reference TEXT,
  received_date TEXT NOT NULL,
  received_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(po_reference) REFERENCES purchase_orders(reference) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_reference TEXT NOT NULL,
  po_item_id INTEGER NOT NULL,
  product_reference TEXT,
  description TEXT NOT NULL,
  quantity_received REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(receipt_reference) REFERENCES goods_receipts(reference) ON DELETE CASCADE,
  FOREIGN KEY(po_item_id) REFERENCES purchase_order_items(id)
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  product_reference TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'adjustment',
  quantity REAL NOT NULL DEFAULT 0,
  reason TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(product_reference) REFERENCES products(reference)
);
`);


// Seed demo vendors if empty
const vendorsCount = (db.prepare('SELECT COUNT(*) AS c FROM vendors').get() as { c: number }).c;
if (vendorsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO vendors (reference, name, code, kind, status, contact_name, contact_email, city, country, payment_terms, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['VEN-0001', 'Acme Supplies', 'ACME-SUP', 'supplier', 'active', 'John Doe', 'john@acmesupplies.com', 'New York', 'USA', 'Net 30', ts, ts],
    ['VEN-0002', 'Global Parts Inc', 'GPI', 'manufacturer', 'active', 'Jane Smith', 'jane@globalparts.com', 'Chicago', 'USA', 'Net 45', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE vendors SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo purchase orders if empty
const poCount = (db.prepare('SELECT COUNT(*) AS c FROM purchase_orders').get() as { c: number }).c;
if (poCount === 0) {
  const ts = new Date().toISOString();
  const info = db.prepare(`INSERT INTO purchase_orders (reference, vendor_reference, vendor_name, status, total_amount, currency, order_date, expected_delivery, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run('tmp', 'VEN-0001', 'Acme Supplies', 'draft', 5000, 'USD', ts.slice(0,10), ts.slice(0,10), 'Initial PO', ts, ts);
  const id = Number(info.lastInsertRowid);
  db.prepare('UPDATE purchase_orders SET reference = ? WHERE id = ?').run('PO-0001', id);
  db.prepare('INSERT INTO purchase_order_items (po_reference, product_reference, description, quantity, unit_price, line_total, received_quantity, sort_order) VALUES (?,?,?,?,?,?,?,?)')
    .run('PO-0001', 'PROD-0001', 'Consulting services', 1, 5000, 5000, 0, 0);
}


db.exec(`
CREATE TABLE IF NOT EXISTS quality_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'incoming',
  status TEXT NOT NULL DEFAULT 'pending',
  product_reference TEXT,
  vendor_reference TEXT,
  purchase_order_reference TEXT,
  inspector TEXT,
  result TEXT,
  notes TEXT,
  inspection_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(product_reference) REFERENCES products(reference),
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference),
  FOREIGN KEY(purchase_order_reference) REFERENCES purchase_orders(reference)
);

CREATE TABLE IF NOT EXISTS non_conformance_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'minor',
  status TEXT NOT NULL DEFAULT 'open',
  inspection_reference TEXT,
  product_reference TEXT,
  vendor_reference TEXT,
  assigned_to INTEGER,
  resolution TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(inspection_reference) REFERENCES quality_inspections(reference),
  FOREIGN KEY(product_reference) REFERENCES products(reference),
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference),
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  person_id INTEGER,
  employee_number TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  position TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  classification TEXT NOT NULL DEFAULT 'employee',
  hire_date TEXT,
  termination_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  base_salary REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  manager_id INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(person_id) REFERENCES people(id),
  FOREIGN KEY(manager_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_reference TEXT NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT NOT NULL DEFAULT 'present',
  hours_worked REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(employee_reference) REFERENCES employees(reference)
);

CREATE TABLE IF NOT EXISTS payroll (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  employee_reference TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  base_salary REAL NOT NULL DEFAULT 0,
  allowances REAL NOT NULL DEFAULT 0,
  deductions REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  net_pay REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  paid_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(employee_reference) REFERENCES employees(reference)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date TEXT,
  end_date TEXT,
  budget REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  manager_id INTEGER,
  customer_reference TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(manager_id) REFERENCES employees(id),
  FOREIGN KEY(customer_reference) REFERENCES customers(reference)
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_reference) REFERENCES projects(reference) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  employee_reference TEXT NOT NULL,
  project_reference TEXT,
  task_reference TEXT,
  date TEXT NOT NULL,
  hours REAL NOT NULL DEFAULT 0,
  description TEXT,
  billable INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY(employee_reference) REFERENCES employees(reference),
  FOREIGN KEY(project_reference) REFERENCES projects(reference),
  FOREIGN KEY(task_reference) REFERENCES tasks(reference)
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'kpi',
  title TEXT NOT NULL,
  config TEXT NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions TEXT NOT NULL DEFAULT '[]',
  actions TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  schedule TEXT NOT NULL DEFAULT 'daily',
  recipients TEXT NOT NULL DEFAULT '[]',
  filters TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  last_run TEXT,
  next_run TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_reference TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT '[]',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);


// Seed demo notifications if empty
const notificationsCount = (db.prepare('SELECT COUNT(*) AS c FROM notifications').get() as { c: number }).c;
if (notificationsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO notifications (reference, type, title, message, entity_type, entity_reference, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['NOTIF-0001', 'info', 'Welcome to Lead Management ERP', 'Your ERP system is ready to use.', null, null, 0, ts],
    ['NOTIF-0002', 'success', 'Lead converted', 'Lead L-0001 has been converted to customer C-0003.', 'lead', 'L-0001', 0, ts],
    ['NOTIF-0003', 'warning', 'Invoice overdue', 'Invoice INV-0002 is past due date.', 'invoice', 'INV-0002', 0, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE notifications SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo scheduled reports if empty
const scheduledReportsCount = (db.prepare('SELECT COUNT(*) AS c FROM scheduled_reports').get() as { c: number }).c;
if (scheduledReportsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO scheduled_reports (reference, name, report_type, schedule, recipients, filters, is_active, last_run, next_run, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['SR-0001', 'Weekly Sales Report', 'profit_loss', 'weekly', '["admin@example.com"]', '{}', 1, null, ts, ts, ts],
    ['SR-0002', 'Monthly Cash Flow', 'cash_flow', 'monthly', '["admin@example.com"]', '{}', 1, null, ts, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE scheduled_reports SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}


db.exec(`
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  errors TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offline_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(entity_type, entity_reference)
);
`);




db.exec(`
CREATE TABLE IF NOT EXISTS import_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  csv_column TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS resource_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  employee_reference TEXT NOT NULL,
  project_reference TEXT,
  task_reference TEXT,
  allocation_type TEXT NOT NULL DEFAULT 'project',
  start_date TEXT NOT NULL,
  end_date TEXT,
  hours_per_week REAL NOT NULL DEFAULT 40,
  utilization_percent REAL NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(employee_reference) REFERENCES employees(reference),
  FOREIGN KEY(project_reference) REFERENCES projects(reference),
  FOREIGN KEY(task_reference) REFERENCES tasks(reference)
);

CREATE TABLE IF NOT EXISTS resource_capacity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_reference TEXT NOT NULL,
  date TEXT NOT NULL,
  available_hours REAL NOT NULL DEFAULT 8,
  allocated_hours REAL NOT NULL DEFAULT 0,
  leave_hours REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(employee_reference, date)
);
`);


db.exec(`
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  entity_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS entity_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_reference TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_reference TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(tag_reference) REFERENCES tags(reference) ON DELETE CASCADE,
  UNIQUE(tag_reference, entity_type, entity_reference)
);
`);


// Seed demo service requests if empty
const requestsCount = (db.prepare('SELECT COUNT(*) AS c FROM service_requests').get() as { c: number }).c;
if (requestsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO service_requests (reference, business_reference, title, status, priority, requested_by, contact_name, contact_email, assigned_team, final_amount, currency, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['REQ-0001', 'C-0001', 'Website Redesign', 'Draft', 'high', 'system', 'John Doe', 'john@acme.com', 'Engineering', 15000, 'USD', 'Complete website overhaul', ts, ts],
    ['REQ-0002', 'C-0002', 'Mobile App Development', 'Submitted', 'urgent', 'system', 'Jane Smith', 'jane@globex.com', 'Engineering', 25000, 'USD', 'Native mobile app', ts, ts],
    ['REQ-0003', 'C-0001', 'API Integration', 'Approved', 'normal', 'system', 'John Doe', 'john@acme.com', 'Engineering', 8000, 'USD', 'Third-party API integration', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE service_requests SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo helpdesk tickets if empty
const ticketsCount = (db.prepare('SELECT COUNT(*) AS c FROM helpdesk_tickets').get() as { c: number }).c;
if (ticketsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO helpdesk_tickets (reference, business_reference, subject, description, type, category, priority, status, assigned_team, contact_name, contact_email, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['TKT-0001', 'C-0001', 'Login issue', 'Cannot login to the portal', 'support', 'technical', 'high', 'New', 'Support', 'John Doe', 'john@acme.com', ts, ts],
    ['TKT-0002', 'C-0002', 'Billing question', 'Question about invoice INV-0002', 'general', 'billing', 'normal', 'Open', 'Support', 'Jane Smith', 'jane@globex.com', ts, ts],
    ['TKT-0003', 'C-0001', 'Feature request', 'Request for new dashboard widget', 'feature', 'general', 'low', 'New', 'Product', 'John Doe', 'john@acme.com', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE helpdesk_tickets SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo documents if empty
const documentsCount = (db.prepare('SELECT COUNT(*) AS c FROM documents').get() as { c: number }).c;
if (documentsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO documents (reference, name, file_name, file_url, file_size, mime_type, entity_type, entity_reference, uploaded_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['DOC-0001', 'Contract', 'contract.pdf', 'https://example.com/contract.pdf', 102400, 'application/pdf', 'customer', 'C-0001', 'admin', ts, ts],
    ['DOC-0002', 'Invoice PDF', 'invoice.pdf', 'https://example.com/invoice.pdf', 51200, 'application/pdf', 'invoice', 'INV-0001', 'admin', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE documents SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo tags if empty
const tagsCount = (db.prepare('SELECT COUNT(*) AS c FROM tags').get() as { c: number }).c;
if (tagsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO tags (reference, name, slug, color, entity_type, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`);
  const samples = [
    ['TAG-0001', 'VIP', 'vip', '#ef4444', null, ts, ts],
    ['TAG-0002', 'Hot Lead', 'hot-lead', '#f97316', 'lead', ts, ts],
    ['TAG-0003', 'Enterprise', 'enterprise', '#8b5cf6', 'customer', ts, ts],
    ['TAG-0004', 'Urgent', 'urgent', '#dc2626', null, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE tags SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo employees if empty
const employeesCount = (db.prepare('SELECT COUNT(*) AS c FROM employees').get() as { c: number }).c;
if (employeesCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO employees (reference, person_id, employee_number, first_name, last_name, email, phone, department, position, employment_type, classification, hire_date, status, base_salary, currency, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['EMP-0001', 1, 'E001', 'Alice', 'Johnson', 'alice@example.com', '+1-555-0101', 'Sales', 'Account Executive', 'full_time', 'employee', '2024-01-15', 'active', 85000, 'USD', 'Top performer', ts, ts],
    ['EMP-0002', 2, 'E002', 'Bob', 'Smith', 'bob@example.com', '+1-555-0102', 'Sales', 'Sales Rep', 'full_time', 'employee', '2024-03-01', 'active', 65000, 'USD', 'Good performer', ts, ts],
    ['EMP-0003', 3, 'E003', 'Carol', 'Davis', 'carol@example.com', '+1-555-0103', 'Marketing', 'Lead Gen', 'full_time', 'employee', '2024-02-15', 'active', 70000, 'USD', 'Marketing specialist', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE employees SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo projects if empty
const projectsCount = (db.prepare('SELECT COUNT(*) AS c FROM projects').get() as { c: number }).c;
if (projectsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO projects (reference, name, description, status, priority, start_date, end_date, budget, currency, customer_reference, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['PROJ-0001', 'ERP Migration', 'Migrate to Next.js', 'active', 'high', '2026-11-01', '2026-12-31', 50000, 'USD', 'C-0001', ts, ts],
    ['PROJ-0002', 'Website Redesign', 'Complete website overhaul', 'planning', 'medium', '2026-12-01', '2027-01-31', 15000, 'USD', 'C-0002', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE projects SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo quality inspections if empty
const inspectionsCount = (db.prepare('SELECT COUNT(*) AS c FROM quality_inspections').get() as { c: number }).c;
if (inspectionsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO quality_inspections (reference, title, type, status, product_reference, vendor_reference, inspector, result, notes, inspection_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['QI-0001', 'Incoming Inspection', 'incoming', 'passed', 'PROD-0001', 'VEN-0001', 'John', 'Pass', 'All checks passed', ts.slice(0,10), ts, ts],
    ['QI-0002', 'Final Inspection', 'final', 'pending', 'PROD-0002', 'VEN-0002', 'Jane', null, 'Pending review', ts.slice(0,10), ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE quality_inspections SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo NCRs if empty
const ncrsCount = (db.prepare('SELECT COUNT(*) AS c FROM non_conformance_reports').get() as { c: number }).c;
if (ncrsCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO non_conformance_reports (reference, title, description, severity, status, product_reference, vendor_reference, resolution, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['NCR-0001', 'Defective part', 'Part does not meet spec', 'major', 'open', 'PROD-0002', 'VEN-0002', null, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE non_conformance_reports SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo audit logs if empty
const auditCount = (db.prepare('SELECT COUNT(*) AS c FROM audit_logs').get() as { c: number }).c;
if (auditCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO audit_logs (entity_type, entity_reference, action, actor, details, created_at) VALUES (?,?,?,?,?,?)`);
  const samples = [
    ['lead', 'L-0001', 'created', 'system', 'Lead Acme Corp created', ts],
    ['customer', 'C-0001', 'created', 'system', 'Customer Acme Corp created', ts],
    ['invoice', 'INV-0001', 'created', 'system', 'Invoice INV-0001 created', ts],
    ['payment', 'PAY-0001', 'created', 'system', 'Payment PAY-0001 recorded', ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      ins.run(...s);
    }
  });
  tx();
}

// Seed demo workflow rules if empty
const wfCount = (db.prepare('SELECT COUNT(*) AS c FROM workflow_rules').get() as { c: number }).c;
if (wfCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO workflow_rules (reference, name, trigger_event, conditions, actions, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['WF-0001', 'Lead follow-up', 'lead_created', '[]', '[{"type":"create_task","title":"Follow up"}]', 1, ts, ts],
    ['WF-0002', 'Invoice reminder', 'invoice_created', '[]', '[{"type":"send_email","template":"invoice_reminder"}]', 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE workflow_rules SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo email templates if empty
const tplCount = (db.prepare('SELECT COUNT(*) AS c FROM email_templates').get() as { c: number }).c;
if (tplCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO email_templates (reference, name, subject, body, type, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['TPL-0001', 'Welcome Email', 'Welcome to our service', 'Hello {{name}}, welcome to our service!', 'email', 1, ts, ts],
    ['TPL-0002', 'Invoice Reminder', 'Invoice {{reference}} is due', 'Your invoice {{reference}} is due on {{dueDate}}.', 'email', 1, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE email_templates SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo notifications if empty
const notifCount = (db.prepare('SELECT COUNT(*) AS c FROM notifications').get() as { c: number }).c;
if (notifCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO notifications (reference, type, title, message, entity_type, entity_reference, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)`);
  const samples = [
    ['NOTIF-0001', 'info', 'Welcome to Lead Management ERP', 'Your ERP system is ready to use.', null, null, 0, ts],
    ['NOTIF-0002', 'success', 'Lead converted', 'Lead L-0001 has been converted to customer C-0001.', 'lead', 'L-0001', 0, ts],
    ['NOTIF-0003', 'warning', 'Invoice overdue', 'Invoice INV-0002 is past due date.', 'invoice', 'INV-0002', 0, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE notifications SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}

// Seed demo scheduled reports if empty
const srCount = (db.prepare('SELECT COUNT(*) AS c FROM scheduled_reports').get() as { c: number }).c;
if (srCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO scheduled_reports (reference, name, report_type, schedule, recipients, filters, is_active, last_run, next_run, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['SR-0001', 'Weekly Sales Report', 'profit_loss', 'weekly', '["admin@example.com"]', '{}', 1, null, ts, ts, ts],
    ['SR-0002', 'Monthly Cash Flow', 'cash_flow', 'monthly', '["admin@example.com"]', '{}', 1, null, ts, ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE scheduled_reports SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}



// Seed demo resource allocations if empty
const allocCount = (db.prepare('SELECT COUNT(*) AS c FROM resource_allocations').get() as { c: number }).c;
if (allocCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO resource_allocations (reference, employee_reference, project_reference, allocation_type, start_date, end_date, hours_per_week, utilization_percent, status, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const samples = [
    ['ALLOC-0001', 'EMP-0001', 'PROJ-0001', 'project', '2026-11-01', '2026-12-31', 40, 80, 'active', 'Full-time on ERP migration', ts, ts],
    ['ALLOC-0002', 'EMP-0002', 'PROJ-0002', 'project', '2026-12-01', '2027-01-31', 20, 50, 'active', 'Part-time on website redesign', ts, ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      const info = ins.run(...s);
      const id = Number(info.lastInsertRowid);
      db.prepare('UPDATE resource_allocations SET reference = ? WHERE id = ?').run(s[0], id);
    }
  });
  tx();
}


// Seed demo resource capacity if empty
const capCount = (db.prepare('SELECT COUNT(*) AS c FROM resource_capacity').get() as { c: number }).c;
if (capCount === 0) {
  const ts = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO resource_capacity (employee_reference, date, available_hours, allocated_hours, leave_hours, notes, created_at) VALUES (?,?,?,?,?,?,?)`);
  const samples = [
    ['EMP-0001', '2026-11-13', 8, 6, 0, 'Normal day', ts],
    ['EMP-0002', '2026-11-13', 8, 4, 0, 'Partial allocation', ts],
    ['EMP-0003', '2026-11-13', 8, 8, 0, 'Fully allocated', ts],
  ];
  const tx = db.transaction(() => {
    for (const s of samples) {
      ins.run(...s);
    }
  });
  tx();
}


db.exec(`
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER,
  category_name TEXT,
  status TEXT NOT NULL DEFAULT 'acquired',
  purchase_price REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  purchase_date TEXT,
  purchase_order_reference TEXT,
  expense_reference TEXT,
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  warranty_expiry TEXT,
  assigned_to INTEGER,
  assigned_branch TEXT,
  business_reference TEXT,
  location TEXT,
  condition_rating INTEGER NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(assigned_to) REFERENCES people(id),
  FOREIGN KEY(business_reference) REFERENCES customers(reference),
  FOREIGN KEY(purchase_order_reference) REFERENCES purchase_orders(reference)
);

CREATE TABLE IF NOT EXISTS asset_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  assigned_to INTEGER,
  assigned_branch TEXT,
  assigned_from TEXT NOT NULL,
  assigned_until TEXT,
  reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY(assigned_to) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  maintenance_type TEXT NOT NULL DEFAULT 'repair',
  description TEXT NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_reference TEXT,
  performed_on TEXT NOT NULL,
  performed_by TEXT,
  next_due TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  depreciation_rate REAL NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Workflow Engine tables
CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config TEXT DEFAULT '{}',
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  config TEXT DEFAULT '{}',
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  condition TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  workflow_id INTEGER NOT NULL,
  workflow_version INTEGER NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data TEXT DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'running',
  current_node_id TEXT,
  context_data TEXT DEFAULT '{}',
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id)
);

CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data TEXT DEFAULT '{}',
  output_data TEXT DEFAULT '{}',
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);

-- Approval Chains
CREATE TABLE IF NOT EXISTS approval_chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  current_step INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS approval_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chain_id INTEGER NOT NULL,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  approver_type TEXT NOT NULL DEFAULT 'user',
  approver_id INTEGER,
  approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decision TEXT,
  comment TEXT,
  decided_at TEXT,
  sla_hours INTEGER,
  escalation_enabled INTEGER NOT NULL DEFAULT 1,
  escalation_recipient_type TEXT,
  escalation_recipient_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(chain_id) REFERENCES approval_chains(id) ON DELETE CASCADE
);

-- SLA Escalation Rules
CREATE TABLE IF NOT EXISTS sla_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  condition TEXT DEFAULT '{}',
  sla_hours INTEGER NOT NULL,
  warning_hours INTEGER,
  escalation_levels TEXT DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  product_reference TEXT NOT NULL,
  product_name TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(product_reference) REFERENCES products(reference)
);

CREATE TABLE IF NOT EXISTS sourcing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  round INTEGER NOT NULL DEFAULT 1,
  whole_deliverable INTEGER NOT NULL DEFAULT 0,
  anonymous INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date TEXT,
  budget REAL,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sourcing_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourcing_request_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  awarded_vendor_reference TEXT,
  awarded_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(sourcing_request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  UNIQUE (sourcing_request_id, sequence)
);

CREATE TABLE IF NOT EXISTS sourcing_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourcing_request_id INTEGER NOT NULL,
  vendor_reference TEXT NOT NULL,
  round INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  UNIQUE (sourcing_request_id, vendor_reference, round),
  FOREIGN KEY(sourcing_request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  sourcing_request_id INTEGER NOT NULL,
  vendor_reference TEXT NOT NULL,
  round INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  submitted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(sourcing_request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_quote_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_reference TEXT NOT NULL,
  line_id INTEGER NOT NULL,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  FOREIGN KEY(quote_reference) REFERENCES vendor_quotes(reference) ON DELETE CASCADE,
  FOREIGN KEY(line_id) REFERENCES sourcing_lines(id)
);

CREATE TABLE IF NOT EXISTS vendor_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  vendor_reference TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'contract',
  url TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT,
  verified_at TEXT,
  uploaded_by TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference)
);

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  vendor_reference TEXT NOT NULL,
  sourcing_request_reference TEXT,
  deliverable TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  trigger_type TEXT NOT NULL DEFAULT 'client_approval',
  status TEXT NOT NULL DEFAULT 'pending',
  released INTEGER NOT NULL DEFAULT 0,
  released_at TEXT,
  released_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference)
);

CREATE TABLE IF NOT EXISTS vendor_invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  vendor_reference TEXT NOT NULL,
  sourcing_request_reference TEXT,
  purchase_order_reference TEXT,
  goods_receipt_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  tax_percent REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  issue_date TEXT,
  due_date TEXT,
  issued_at TEXT,
  paid_at TEXT,
  voided_at TEXT,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  match_status TEXT NOT NULL DEFAULT 'pending',
  matched_amount REAL NOT NULL DEFAULT 0,
  exception_reason TEXT,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(vendor_reference) REFERENCES vendors(reference)
);

CREATE TABLE IF NOT EXISTS vendor_invoice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_invoice_reference TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  description TEXT,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL,
  FOREIGN KEY(vendor_invoice_reference) REFERENCES vendor_invoices(reference) ON DELETE CASCADE,
  UNIQUE (vendor_invoice_reference, sequence)
);

CREATE TABLE IF NOT EXISTS vendor_invoice_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_invoice_reference TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  reference TEXT,
  note TEXT,
  paid_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vendor_invoice_reference) REFERENCES vendor_invoices(reference) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_credit_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_invoice_reference TEXT NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  refunded_at TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vendor_invoice_reference) REFERENCES vendor_invoices(reference) ON DELETE CASCADE
);
`);


// Migrations: add reorder columns to products if missing
try {
  const cols = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
  const names = cols.map((c) => c.name);
  if (!names.includes('reorder_point')) {
    db.exec('ALTER TABLE products ADD COLUMN reorder_point REAL NOT NULL DEFAULT 0');
  }
  if (!names.includes('reorder_quantity')) {
    db.exec('ALTER TABLE products ADD COLUMN reorder_quantity REAL NOT NULL DEFAULT 0');
  }
} catch (e) { console.error('product migration failed', e); }

// Migrations: add expense asset fields if missing
try {
  const cols = db.prepare("PRAGMA table_info(expenses)").all() as Array<{ name: string }>;
  const names = cols.map((c) => c.name);
  if (!names.includes('vendor_reference')) {
    db.exec('ALTER TABLE expenses ADD COLUMN vendor_reference TEXT');
  }
  if (!names.includes('asset_reference')) {
    db.exec('ALTER TABLE expenses ADD COLUMN asset_reference TEXT');
  }
  if (!names.includes('purchase_order_reference')) {
    db.exec('ALTER TABLE expenses ADD COLUMN purchase_order_reference TEXT');
  }
  if (!names.includes('asset_category')) {
    db.exec('ALTER TABLE expenses ADD COLUMN asset_category TEXT');
  }
  if (!names.includes('is_asset_purchase')) {
    db.exec('ALTER TABLE expenses ADD COLUMN is_asset_purchase INTEGER NOT NULL DEFAULT 0');
  }
  if (!names.includes('asset_depreciation_reference')) {
    db.exec('ALTER TABLE expenses ADD COLUMN asset_depreciation_reference TEXT');
  }
} catch (e) { console.error('expense migration failed', e); }

// Migrations: add vendor_invoice 3-way match fields if missing
try {
  const cols = db.prepare("PRAGMA table_info(vendor_invoices)").all() as Array<{ name: string }>;
  const names = cols.map((c) => c.name);
  if (!names.includes('purchase_order_reference')) {
    db.exec('ALTER TABLE vendor_invoices ADD COLUMN purchase_order_reference TEXT');
  }
  if (!names.includes('goods_receipt_reference')) {
    db.exec('ALTER TABLE vendor_invoices ADD COLUMN goods_receipt_reference TEXT');
  }
  if (!names.includes('match_status')) {
    db.exec('ALTER TABLE vendor_invoices ADD COLUMN match_status TEXT NOT NULL DEFAULT "pending"');
  }
  if (!names.includes('matched_amount')) {
    db.exec('ALTER TABLE vendor_invoices ADD COLUMN matched_amount REAL NOT NULL DEFAULT 0');
  }
  if (!names.includes('exception_reason')) {
    db.exec('ALTER TABLE vendor_invoices ADD COLUMN exception_reason TEXT');
  }
} catch (e) { console.error('vendor_invoice migration failed', e); }

export default db;