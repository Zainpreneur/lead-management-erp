import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listReorderCandidates } from '@/lib/server/products';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'products:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const candidates = listReorderCandidates();
  return NextResponse.json({ candidates });
}
