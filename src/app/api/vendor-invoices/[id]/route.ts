import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getVendorInvoiceByIdOrRef, voidVendorInvoice } from '@/lib/server/vendor-finance';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const invoice = getVendorInvoiceByIdOrRef(decodeURIComponent(id));
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ invoice });
}
