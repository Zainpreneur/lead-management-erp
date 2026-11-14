import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listSourcingRequests, createSourcingRequest } from '@/lib/server/sourcing';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const requests = listSourcingRequests({
    status: url.searchParams.get('status') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const req = createSourcingRequest(body);
    try { await logAudit('sourcing_request', req.reference, 'created', `Sourcing request ${req.reference} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ request: req }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
