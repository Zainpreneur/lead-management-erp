import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getSourcingRequestByIdOrRef, closeRoundAndOpenNext, inviteVendors } from '@/lib/server/sourcing';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json().catch(()=>({}));
    const sr = getSourcingRequestByIdOrRef(decodeURIComponent(id));
    if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = closeRoundAndOpenNext(sr.id);
    if (Array.isArray(body?.vendorReferences) && body.vendorReferences.length) {
      inviteVendors(updated.id, body.vendorReferences, updated.round);
    }
    return NextResponse.json({ request: updated });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown' }, { status: 400 }); }
}
