import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { recordVendorInvoicePayment } from '@/lib/server/vendor-finance';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const payment = recordVendorInvoicePayment({ ...body, vendorInvoiceReference: decodeURIComponent(id) });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
