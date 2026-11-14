import { NextResponse } from 'next/server';
import { calculateLeadScore, getLeadByIdOrRef } from '@/lib/server/leads';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
        const lead = getLeadByIdOrRef(id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    const result = calculateLeadScore(lead.reference);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}