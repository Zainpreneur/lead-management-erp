import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listEmployees, createEmployee } from '@/lib/server/workforce';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'employees:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const employees = listEmployees({
    search: url.searchParams.get('search') || undefined,
    department: url.searchParams.get('department') || undefined,
    status: url.searchParams.get('status') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ employees });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'employees:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const employee = createEmployee(body);
    return NextResponse.json({ employee }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}