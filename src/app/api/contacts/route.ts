import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listContacts, createContact } from '@/lib/server/contacts';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'contacts:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const contacts = listContacts({
    search: url.searchParams.get('search') || undefined,
    customerReference: url.searchParams.get('customerReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'contacts:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const contact = createContact(body);
    try { await logAudit('contact', contact.reference, 'created', `Contact ${contact.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
