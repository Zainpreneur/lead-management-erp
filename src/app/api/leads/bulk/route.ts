import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bulkSetLeadStage, bulkAssignLeads, bulkDeleteLeads } from '@/lib/server/leads';

const bulkStageSchema = z.object({
  ids: z.array(z.number()).min(1),
  stage: z.enum(['new', 'contacted', 'qualified', 'quoted', 'won', 'lost']),
  actor: z.string(),
});

const bulkAssignSchema = z.object({
  ids: z.array(z.number()).min(1),
  assignedTo: z.number(),
  assignedTeam: z.string().nullable().optional(),
  actor: z.string(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.number()).min(1),
  actor: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Determine which bulk operation based on the action
    if (body.action === 'stage') {
      const parsed = bulkStageSchema.parse(body);
      await bulkSetLeadStage(parsed.ids, parsed.stage, parsed.actor);
      return NextResponse.json({ ok: true });
    }
    
    if (body.action === 'assign') {
      const parsed = bulkAssignSchema.parse(body);
      await bulkAssignLeads(parsed.ids, parsed.assignedTo, parsed.assignedTeam ?? null, parsed.actor);
      return NextResponse.json({ ok: true });
    }
    
    if (body.action === 'delete') {
      const parsed = bulkDeleteSchema.parse(body);
      await bulkDeleteLeads(parsed.ids, parsed.actor);
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}