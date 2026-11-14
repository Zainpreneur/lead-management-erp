import { NextResponse } from 'next/server';
import { z } from 'zod';
import { convertLead, getLeadByIdOrRef } from '@/lib/server/leads';
import { leadConvertSchema } from '@/lib/server/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = leadConvertSchema.parse(body);
        const leadRef = getLeadByIdOrRef(id);
    if (!leadRef) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    const result = await convertLead(leadRef.reference, parsed);
    return NextResponse.json({ result }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}