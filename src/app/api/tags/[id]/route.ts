import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { deleteTag } from '@/lib/server/tags';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'tags:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    deleteTag(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}