import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { listInvoices, createInvoice } from '@/lib/server/invoices';
import { logAudit } from '@/lib/server/audit';
import { invoiceInputSchema } from '@/lib/server/invoiceValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'invoices:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const invoices = listInvoices({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    customerReference: url.searchParams.get('customerReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'invoices:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = invoiceInputSchema.parse(body);
    const invoice = createInvoice(parsed);
    try { await logAudit('invoice', invoice.reference, 'created', `Invoice ${invoice.reference} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}