import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getAssetByIdOrRef, calculateDepreciation } from '@/lib/server/assets';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_request, 'assets:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const asset = getAssetByIdOrRef(decodeURIComponent(id));
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const depreciation = calculateDepreciation(asset);
    return NextResponse.json({ depreciation });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
