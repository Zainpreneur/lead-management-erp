import { NextResponse } from 'next/server';
import { updateCurrency, deleteCurrency } from '@/lib/server/taxCurrencies';

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await request.json();
    const currency = updateCurrency(decodeURIComponent(code), body);
    return NextResponse.json({ currency });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    deleteCurrency(decodeURIComponent(code));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}