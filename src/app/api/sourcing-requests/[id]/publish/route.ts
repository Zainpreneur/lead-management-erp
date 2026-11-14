import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { publishSourcingRequest } from '@/lib/server/sourcing';
export async function POST(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_r, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try { const req = publishSourcingRequest(decodeURIComponent(id)); return NextResponse.json({ request: req }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 400 }); }
}
