import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listBranches, createBranch } from '@/lib/server/businessBranches';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'branches:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const businessRef = url.searchParams.get('businessReference');
  if (!businessRef) {
    return NextResponse.json({ error: 'businessReference required' }, { status: 400 });
  }
  const branches = listBranches(businessRef);
  return NextResponse.json({ branches });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'branches:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const branch = createBranch(body);
    return NextResponse.json({ branch }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}