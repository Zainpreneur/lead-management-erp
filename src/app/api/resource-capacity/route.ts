import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listCapacity, createCapacity } from '@/lib/server/resourcePlanning';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'resources:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const capacity = listCapacity({
    employeeReference: url.searchParams.get('employeeReference') || undefined,
    date: url.searchParams.get('date') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ capacity });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'resources:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const cap = createCapacity(body);
    return NextResponse.json({ capacity: cap }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}