import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { getLeadByIdOrRef, updateLead, deleteLead } from '@/lib/server/leads';
import { leadInputSchema } from '@/lib/server/validation';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'leads:read');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  const lead = getLeadByIdOrRef(decodeURIComponent(id));
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(request, 'leads:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = leadInputSchema.partial().parse(body);
    const lead = updateLead(decodeURIComponent(id), parsed);
    return NextResponse.json({ lead });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error: permError } = requirePermission(_request, 'leads:write');
  if (permError) return NextResponse.json({ error: permError }, { status: permError === 'Unauthorized' ? 401 : 403 });
  const { id } = await params;
  try {
    deleteLead(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}