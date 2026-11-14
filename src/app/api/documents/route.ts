import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listDocuments, createDocument } from '@/lib/server/documents';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'documents:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const documents = listDocuments({
    entityType: url.searchParams.get('entityType') || undefined,
    entityReference: url.searchParams.get('entityReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'documents:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const document = createDocument(body);
    try { await logAudit('document', document.reference, 'created', `Document ${document.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}