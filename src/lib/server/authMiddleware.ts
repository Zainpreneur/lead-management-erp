import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';

export function withPermission(permission: string, handler: (request: Request, user: unknown) => Promise<NextResponse>) {
  return async (request: Request) => {
    const { user, error } = requirePermission(request, permission);
    if (error) {
      return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
    }
    return handler(request, user);
  };
}

export function checkPermission(request: Request, permission: string): { user: unknown; error?: NextResponse } {
  const { user, error } = requirePermission(request, permission);
  if (error) {
    return { user: null, error: NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 }) };
  }
  return { user };
}