import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getSourcingRequestByIdOrRef, updateSourcingRequest } from '@/lib/server/sourcing';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const req = getSourcingRequestByIdOrRef(decodeURIComponent(id));
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ request: req });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const req = updateSourcingRequest(decodeURIComponent(id), body);
    return NextResponse.json({ request: req });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
