import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listLeads, createLead, updateLead, leadSummary, getLeadByIdOrRef, addLeadActivity, convertLead, calculateLeadScore, bulkSetLeadStage, bulkAssignLeads, bulkDeleteLeads, deleteLead } from '@/lib/server/leads';
import { leadInputSchema, leadActivitySchema, leadStageSchema, leadConvertSchema } from '@/lib/server/validation';
import { createTask } from '@/lib/server/tasks';
import { logAudit } from '@/lib/server/audit';
import { requirePermission } from '@/lib/server/rbac';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'leads:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const filters = {
    search: url.searchParams.get('search') || undefined,
    stage: url.searchParams.get('stage') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    source: url.searchParams.get('source') || undefined,
    assignedTo: url.searchParams.get('assignedTo') ? Number(url.searchParams.get('assignedTo')) : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  };
  const leads = listLeads(filters);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'leads:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = leadInputSchema.parse(body);
    const lead = createLead(parsed);
    try {
      await createTask({ title: `Follow up: ${lead.name}`, relatedType: 'lead', relatedReference: lead.reference, priority: 'medium' });
      await logAudit('lead', lead.reference, 'created', `Lead ${lead.name} created`);
    } catch (e) { console.error(e); }
    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // Handle different PATCH endpoints
  if (url.pathname.includes('/stage')) {
    try {
      const body = await request.json();
      const { stage, actor, notes } = body;
      const lead = updateLead(id, { stage, notes }, actor);
      return NextResponse.json({ lead });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  if (url.pathname.includes('/convert')) {
    try {
      const body = await request.json();
      const result = convertLead(id, body);
      return NextResponse.json({ result }, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  if (url.pathname.includes('/activities')) {
    try {
      const body = await request.json();
      const activity = addLeadActivity(Number(id), body.kind, body.summary, body.note, body.actor);
      return NextResponse.json({ activity }, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  if (url.pathname.includes('/score')) {
    try {
      const result = calculateLeadScore(id);
      return NextResponse.json({ result });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  // Generic update
  try {
    const body = await request.json();
    const lead = updateLead(id, body);
    return NextResponse.json({ lead });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST_BULK(request: Request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/bulk/stage')) {
    try {
      const body = await request.json();
      const { ids, stage, actor } = body;
      await bulkSetLeadStage(ids, stage, actor);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  if (url.pathname.includes('/bulk/assign')) {
    try {
      const body = await request.json();
      const { ids, assignedTo, assignedTeam, actor } = body;
      await bulkAssignLeads(ids, assignedTo, assignedTeam, actor);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  if (url.pathname.includes('/bulk/delete')) {
    try {
      const body = await request.json();
      const { ids, actor } = body;
      await bulkDeleteLeads(ids, actor);
      return NextResponse.json({ ok: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid endpoint' }, { status: 404 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}