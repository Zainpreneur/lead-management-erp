import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { updateVendor, deleteVendor } from '@/lib/server/procurement';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(request, 'vendors:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const vendor = updateVendor(decodeURIComponent(id), body);
    return NextResponse.json({ vendor });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'vendors:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    deleteVendor(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}