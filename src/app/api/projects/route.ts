import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listProjects, createProject } from '@/lib/server/workforce';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'projects:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const projects = listProjects({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    priority: url.searchParams.get('priority') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'projects:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const project = createProject(body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}