import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listTickets, createTicket } from '@/lib/server/tickets';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'tickets:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const tickets = listTickets({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    businessReference: url.searchParams.get('businessReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'tickets:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const ticket = createTicket(body);
    try { await logAudit('ticket', ticket.reference, 'created', `Ticket ${ticket.subject} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}