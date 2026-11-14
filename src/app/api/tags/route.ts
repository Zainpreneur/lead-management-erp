import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listTags, createTag } from '@/lib/server/tags';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'tags:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const tags = listTags({
    search: url.searchParams.get('search') || undefined,
    entityType: url.searchParams.get('entityType') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'tags:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const tag = createTag(body);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}