import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { listRequests, createRequest, updateRequest, deleteRequest } from '@/lib/server/serviceRequests';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'requests:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const requests = listRequests({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    businessReference: url.searchParams.get('businessReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'requests:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const newRequest = createRequest(body);
    try { await logAudit('request', newRequest.reference, 'created', `Request ${newRequest.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}