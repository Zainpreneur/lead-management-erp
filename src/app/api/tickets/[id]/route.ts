import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getTicketByIdOrRef, updateTicket, deleteTicket } from '@/lib/server/tickets';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'tickets:read');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const ticket = getTicketByIdOrRef(decodeURIComponent(id));
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(request, 'tickets:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const ticket = updateTicket(decodeURIComponent(id), body);
    return NextResponse.json({ ticket });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'tickets:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    deleteTicket(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}