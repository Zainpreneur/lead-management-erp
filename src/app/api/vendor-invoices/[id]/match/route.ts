import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { matchVendorInvoice } from '@/lib/server/vendor-finance';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const result = matchVendorInvoice(decodeURIComponent(id));
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
