import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listTransactions, createTransaction } from '@/lib/server/cashAccounts';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'cash:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const transactions = listTransactions({
    accountReference: url.searchParams.get('accountReference') || undefined,
    type: url.searchParams.get('type') || undefined,
    reconciled: url.searchParams.get('reconciled') ? url.searchParams.get('reconciled') === 'true' : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'cash:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const transaction = createTransaction(body);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}