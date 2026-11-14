import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listNCRs, createNCR } from '@/lib/server/quality';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'quality:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const ncrs = listNCRs({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    severity: url.searchParams.get('severity') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ ncrs });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'quality:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const ncr = createNCR(body);
    try { await logAudit('ncr', ncr.reference, 'created', `NCR ${ncr.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ ncr }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}