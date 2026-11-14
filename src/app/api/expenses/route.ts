import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { listExpenses, createExpense } from '@/lib/server/expenses';
import { logAudit } from '@/lib/server/audit';
import { expenseInputSchema } from '@/lib/server/expenseValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'expenses:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const expenses = listExpenses({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    category: url.searchParams.get('category') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'expenses:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = expenseInputSchema.parse(body);
    const expense = createExpense(parsed);
    try { await logAudit('expense', expense.reference, 'created', `Expense ${expense.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
