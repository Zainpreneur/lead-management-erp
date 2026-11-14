import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listInspections, createInspection } from '@/lib/server/quality';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'quality:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const inspections = listInspections({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    type: url.searchParams.get('type') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ inspections });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'quality:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const inspection = createInspection(body);
    try { await logAudit('inspection', inspection.reference, 'created', `Inspection ${inspection.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ inspection }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}