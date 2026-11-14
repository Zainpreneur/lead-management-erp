import db from './db';
import { getSession } from './auth';

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  manager: ['leads:read', 'leads:write', 'customers:read', 'customers:write', 'invoices:read', 'invoices:write', 'expenses:read', 'expenses:write', 'reports:read', 'tasks:read', 'tasks:write', 'products:read', 'products:write', 'contacts:read', 'contacts:write'],
  user: ['leads:read', 'leads:write', 'customers:read', 'customers:write', 'invoices:read', 'tasks:read', 'tasks:write', 'products:read', 'contacts:read'],
  viewer: ['leads:read', 'customers:read', 'invoices:read', 'reports:read', 'tasks:read', 'products:read', 'contacts:read'],
};

export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export function requirePermission(request: Request, permission: string): { user: unknown; error?: string } {
  const cookie = request.headers.get('cookie');
  const sessionMatch = cookie?.match(/session=([^;]+)/);
  const sessionId = sessionMatch?.[1];
  
  if (!sessionId) {
    return { user: null, error: 'Unauthorized' };
  }
  
  const user = getSession(sessionId);
  if (!user) {
    return { user: null, error: 'Unauthorized' };
  }
  
  if (!hasPermission(user.role, permission)) {
    return { user, error: 'Forbidden' };
  }
  
  return { user };
}

export function getCurrentUser(request: Request): unknown {
  const cookie = request.headers.get('cookie');
  const sessionMatch = cookie?.match(/session=([^;]+)/);
  const sessionId = sessionMatch?.[1];
  
  if (!sessionId) return null;
  return getSession(sessionId);
}