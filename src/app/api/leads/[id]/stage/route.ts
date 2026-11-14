import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateLead, getLeadByIdOrRef } from '@/lib/server/leads';
import { leadStageSchema } from '@/lib/server/validation';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { stage, actor, notes } = body;
        const leadRef = getLeadByIdOrRef(id);
    if (!leadRef) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    const lead = updateLead(leadRef.reference, { stage, notes }, actor);
    return NextResponse.json({ lead });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}