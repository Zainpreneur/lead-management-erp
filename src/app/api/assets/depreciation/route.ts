import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { calculateAllDepreciation } from '@/lib/server/assets';

export async function POST(_request: Request) {
  const { error } = requirePermission(_request, 'assets:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const result = calculateAllDepreciation();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
