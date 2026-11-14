import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { listAccounts, createAccount } from '@/lib/server/cashAccounts';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'cash:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const accounts = listAccounts({
    search: url.searchParams.get('search') || undefined,
    type: url.searchParams.get('type') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'cash:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const account = createAccount(body);
    try { await logAudit('cash_account', account.reference, 'created', `Account ${account.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}