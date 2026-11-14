import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { listCustomers, createCustomer } from '@/lib/server/customers';
import { logAudit } from '@/lib/server/audit';
import { customerInputSchema } from '@/lib/server/customerValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'customers:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const customers = listCustomers({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    assignedTo: url.searchParams.get('assignedTo') ? Number(url.searchParams.get('assignedTo')) : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'customers:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = customerInputSchema.parse(body);
    const customer = createCustomer(parsed);
    try { await logAudit('customer', customer.reference, 'created', `Customer ${customer.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ customer }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}