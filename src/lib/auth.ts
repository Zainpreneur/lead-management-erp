import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      users,
      sessions,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false, // Don't allow users to set their own role
      },
      team: {
        type: 'string',
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type Session = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    team: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};
export type User = Session['user'];

// Server-side auth helpers
export async function getSession(request: Request) {
  return await auth.api.getSession({ headers: request.headers });
}

export async function getUser(request: Request) {
  const session = await getSession(request);
  return session?.user || null;
}

export function hasPermission(role: string, permission: string): boolean {
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],
    manager: [
      'leads:read', 'leads:write',
      'customers:read', 'customers:write',
      'invoices:read', 'invoices:write',
      'expenses:read', 'expenses:write',
      'reports:read',
      'tasks:read', 'tasks:write',
      'products:read', 'products:write',
      'contacts:read', 'contacts:write',
      'vendors:read', 'vendors:write',
      'purchase-orders:read', 'purchase-orders:write',
      'assets:read', 'assets:write',
      'employees:read', 'employees:write',
      'projects:read', 'projects:write',
    ],
    user: [
      'leads:read', 'leads:write',
      'customers:read', 'customers:write',
      'invoices:read',
      'tasks:read', 'tasks:write',
      'products:read',
      'contacts:read',
    ],
    viewer: [
      'leads:read',
      'customers:read',
      'invoices:read',
      'reports:read',
      'tasks:read',
      'products:read',
      'contacts:read',
    ],
  };

  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}

export async function requirePermission(request: Request, permission: string) {
  const session = await getSession(request);
  if (!session) {
    return { user: null, error: 'Unauthorized' as const };
  }

  const userRole = (session.user as any).role || 'user';
  if (!hasPermission(userRole, permission)) {
    return { user: session.user, error: 'Forbidden' as const };
  }

  return { user: session.user, error: null as null };
}