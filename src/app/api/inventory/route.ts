import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listInventoryAdjustments, createInventoryAdjustment } from '@/lib/server/procurement';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'inventory:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const adjustments = listInventoryAdjustments({
    productReference: url.searchParams.get('productReference') || undefined,
    type: url.searchParams.get('type') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ adjustments });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'inventory:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const adjustment = createInventoryAdjustment(body);
    return NextResponse.json({ adjustment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}