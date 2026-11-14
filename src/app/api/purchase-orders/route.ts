import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listPurchaseOrders, createPurchaseOrder } from '@/lib/server/procurement';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const orders = listPurchaseOrders({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    vendorReference: url.searchParams.get('vendorReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const order = createPurchaseOrder(body);
    try { await logAudit('purchase_order', order.reference, 'created', `Purchase order ${order.reference} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}