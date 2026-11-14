import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { releaseVendorPayout } from '@/lib/server/vendor-finance';

export async function POST(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_r, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const payout = releaseVendorPayout(decodeURIComponent(id), 'admin');
    return NextResponse.json({ payout });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
