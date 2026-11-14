import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { addTagToEntity, removeTagFromEntity, getEntityTags } from '@/lib/server/tags';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'tags:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType');
  const entityReference = url.searchParams.get('entityReference');
  if (!entityType || !entityReference) {
    return NextResponse.json({ error: 'entityType and entityReference required' }, { status: 400 });
  }
  const tags = getEntityTags(entityType, entityReference);
  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'tags:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const { tagReference, entityType, entityReference } = body;
    addTagToEntity(tagReference, entityType, entityReference);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { tagReference, entityType, entityReference } = body;
    removeTagFromEntity(tagReference, entityType, entityReference);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}