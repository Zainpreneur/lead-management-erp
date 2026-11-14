import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { invoiceGate } from '@/lib/server/procurement';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const gate = invoiceGate(decodeURIComponent(id));
  return NextResponse.json({ gate });
}
