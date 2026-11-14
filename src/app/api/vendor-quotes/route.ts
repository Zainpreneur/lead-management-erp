import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { submitQuote, listQuotes } from '@/lib/server/sourcing';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'procurement:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const srId = url.searchParams.get('sourcingRequestId');
  if (!srId) return NextResponse.json({ error: 'sourcingRequestId required' }, { status: 400 });
  const quotes = listQuotes(Number(srId), url.searchParams.get('round') ? Number(url.searchParams.get('round')) : undefined);
  return NextResponse.json({ quotes });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'procurement:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const quote = submitQuote(body);
    try { await logAudit('vendor_quote', quote.reference, 'submitted', `Quote ${quote.reference} submitted`); } catch (e) { console.error(e); }
    return NextResponse.json({ quote }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
  }
}
