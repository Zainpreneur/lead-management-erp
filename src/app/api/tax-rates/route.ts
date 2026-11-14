import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listTaxRates, createTaxRate } from '@/lib/server/taxCurrencies';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'finance:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const rates = listTaxRates({
    search: url.searchParams.get('search') || undefined,
    type: url.searchParams.get('type') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ rates });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'finance:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const rate = createTaxRate(body);
    return NextResponse.json({ rate }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}