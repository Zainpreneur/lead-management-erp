import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addLeadActivity, getLeadByIdOrRef } from '@/lib/server/leads';
import { leadActivitySchema } from '@/lib/server/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = leadActivitySchema.parse(body);
        // Resolve lead reference to numeric ID
    const lead = getLeadByIdOrRef(id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    const activity = addLeadActivity(lead.id, parsed.kind, parsed.summary, parsed.note ?? null, parsed.actor ?? "system");
    return NextResponse.json({ activity }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}