import { NextResponse } from 'next/server';
import { listWorkflowRules, createWorkflowRule } from '@/lib/server/automation';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rules = listWorkflowRules({
    triggerEvent: url.searchParams.get('triggerEvent') || undefined,
    isActive: url.searchParams.get('isActive') ? url.searchParams.get('isActive') === 'true' : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule = createWorkflowRule(body);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}