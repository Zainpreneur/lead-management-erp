import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { disposeAsset } from '@/lib/server/assets';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'assets:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await _request.json();
    const asset = disposeAsset(decodeURIComponent(id), body);
    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
