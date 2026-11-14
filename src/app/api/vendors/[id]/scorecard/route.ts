import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { calculateVendorScorecard, updateVendorScorecard } from '@/lib/server/procurement';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scorecard = calculateVendorScorecard(decodeURIComponent(id));
  return NextResponse.json({ scorecard });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requirePermission({} as Request, 'vendors:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });

  const { id } = await params;
  try {
    updateVendorScorecard(decodeURIComponent(id));
    const scorecard = calculateVendorScorecard(decodeURIComponent(id));
    return NextResponse.json({ scorecard });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}