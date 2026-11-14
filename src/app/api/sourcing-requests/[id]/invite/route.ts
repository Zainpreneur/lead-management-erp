import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getSourcingRequestByIdOrRef, inviteVendors, listInvites } from '@/lib/server/sourcing';
export async function GET(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(_r, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const sr = getSourcingRequestByIdOrRef(decodeURIComponent(id));
  if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const invites = listInvites(sr.id);
  return NextResponse.json({ invites });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const sr = getSourcingRequestByIdOrRef(decodeURIComponent(id));
    if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const invites = inviteVendors(sr.id, body.vendorReferences ?? [], body.round ?? sr.round);
    return NextResponse.json({ invites }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 400 }); }
}
