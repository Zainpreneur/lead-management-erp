import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listCurrencies, createCurrency } from '@/lib/server/taxCurrencies';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'finance:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const currencies = listCurrencies({
    search: url.searchParams.get('search') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ currencies });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'finance:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const currency = createCurrency(body);
    return NextResponse.json({ currency }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}