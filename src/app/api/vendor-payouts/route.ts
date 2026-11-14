import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listVendorPayouts, createVendorPayout } from '@/lib/server/vendor-finance';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const payouts = listVendorPayouts({
    vendorReference: url.searchParams.get('vendorReference') || undefined,
    status: url.searchParams.get('status') || undefined,
    released: url.searchParams.get('released') === 'true' ? true : url.searchParams.get('released') === 'false' ? false : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ payouts });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const payout = createVendorPayout(body);
    return NextResponse.json({ payout }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
