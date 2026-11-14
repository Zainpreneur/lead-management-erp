import { NextResponse } from 'next/server';
import { saveSnapshot, getSnapshot, listSnapshots } from '@/lib/server/offline';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType') || undefined;
  const entityRef = url.searchParams.get('entityReference') || undefined;
  
  if (entityType && entityRef) {
    const snapshot = getSnapshot(entityType, entityRef);
    return NextResponse.json({ snapshot });
  }
  
  const snapshots = listSnapshots(entityType);
  return NextResponse.json({ snapshots });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, entityReference, data, version } = body;
    saveSnapshot(entityType, entityReference, data, version);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}