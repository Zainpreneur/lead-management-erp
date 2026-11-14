import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { logAudit } from '@/lib/server/audit';
import { z } from 'zod';
import { listTasks, createTask } from '@/lib/server/tasks';
import { taskInputSchema } from '@/lib/server/taskValidation';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'tasks:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const tasks = listTasks({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    assignedTo: url.searchParams.get('assignedTo') ? Number(url.searchParams.get('assignedTo')) : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'tasks:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const parsed = taskInputSchema.parse(body);
    const task = createTask(parsed);
    try { await logAudit('task', task.reference, 'created', `Task ${task.title} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', issues: err.issues }, { status: 400 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
