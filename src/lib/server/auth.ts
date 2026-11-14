import db from './db';
import crypto from 'node:crypto';

interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  role: string;
  team: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  team: string | null;
  isActive: boolean;
}

function now() { return new Date().toISOString(); }

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

export function createUser(input: { email: string; name: string; password: string; role?: string; team?: string }): User {
  const ts = now();
  const passwordHash = hashPassword(input.password);
  const info = db.prepare(`INSERT INTO users (email, name, password_hash, role, team, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(input.email, input.name, passwordHash, input.role ?? 'user', input.team ?? null, 1, ts, ts);
  const id = Number(info.lastInsertRowid);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return { id: row.id, email: row.email, name: row.name, role: row.role, team: row.team, isActive: row.is_active === 1 };
}

export function authenticateUser(email: string, password: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as UserRow | undefined;
  if (!row) return null;
  if (!verifyPassword(password, row.password_hash)) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, team: row.team, isActive: row.is_active === 1 };
}

export function getUserById(id: number): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id) as UserRow | undefined;
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, team: row.team, isActive: row.is_active === 1 };
}

export function listUsers(): User[] {
  const rows = db.prepare('SELECT * FROM users WHERE is_active = 1 ORDER BY name').all() as UserRow[];
  return rows.map((r) => ({ id: r.id, email: r.email, name: r.name, role: r.role, team: r.team, isActive: r.is_active === 1 }));
}

export function updateUserRole(id: number, role: string): User | null {
  const ts = now();
  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, ts, id);
  return getUserById(id);
}

export function deactivateUser(id: number): void {
  const ts = now();
  db.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?').run(ts, id);
}

export function createSession(userId: number): string {
  const id = crypto.randomUUID();
  const ts = now();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?,?,?,?)').run(id, userId, expires, ts);
  return id;
}

export function getSession(sessionId: string): User | null {
  const row = db.prepare('SELECT s.*, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1').get(sessionId, now()) as { user_id: number; email: string; name: string; role: string; team: string | null; is_active: number } | undefined;
  if (!row) return null;
  return { id: row.user_id, email: row.email, name: row.name, role: row.role, team: row.team, isActive: row.is_active === 1 };
}

export function deleteSession(sessionId: string): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function cleanupExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
}