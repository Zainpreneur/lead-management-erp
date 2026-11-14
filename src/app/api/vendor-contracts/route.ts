import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listVendorContracts, createVendorContract, verifyVendorContract } from '@/lib/server/vendor-finance';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const contracts = listVendorContracts({
    vendorReference: url.searchParams.get('vendorReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ contracts });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const contract = createVendorContract(body);
    return NextResponse.json({ contract }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
