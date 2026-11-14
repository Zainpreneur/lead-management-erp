import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { z } from 'zod';
import { listPayments, createPayment } from '@/lib/server/payments';
import { paymentInputSchema } from '@/lib/server/paymentValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'payments:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const payments = listPayments({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    invoiceReference: url.searchParams.get('invoiceReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ payments });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'payments:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = paymentInputSchema.parse(body);
    const payment = createPayment(parsed);
    try { await logAudit('payment', payment.reference, 'created', `Payment ${payment.reference} recorded`); } catch (e) { console.error(e); }
    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
