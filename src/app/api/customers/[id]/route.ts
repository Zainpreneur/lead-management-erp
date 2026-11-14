import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { getCustomerByIdOrRef, updateCustomer, deleteCustomer } from '@/lib/server/customers';
import { customerInputSchema } from '@/lib/server/customerValidation';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'customers:read');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const customer = getCustomerByIdOrRef(decodeURIComponent(id));
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(request, 'customers:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = customerInputSchema.partial().parse(body);
    const customer = updateCustomer(decodeURIComponent(id), parsed);
    return NextResponse.json({ customer });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'customers:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    deleteCustomer(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}