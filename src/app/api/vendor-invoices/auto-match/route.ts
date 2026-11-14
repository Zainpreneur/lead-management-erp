import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { autoMatchVendorInvoices } from '@/lib/server/vendor-finance';

export async function POST(_request: Request) {
  const { error } = requirePermission(_request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const result = autoMatchVendorInvoices();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
