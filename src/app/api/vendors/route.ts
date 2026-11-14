import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listVendors, createVendor } from '@/lib/server/procurement';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'vendors:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const vendors = listVendors({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    kind: url.searchParams.get('kind') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ vendors });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'vendors:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const vendor = createVendor(body);
    try { await logAudit('vendor', vendor.reference, 'created', `Vendor ${vendor.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}