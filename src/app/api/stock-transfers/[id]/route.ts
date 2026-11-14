import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { updateStockTransferStatus } from '@/lib/server/procurement';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const transfer = updateStockTransferStatus(decodeURIComponent(id), body.status ?? 'completed');
    return NextResponse.json({ transfer });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
