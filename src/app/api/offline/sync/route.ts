import { NextResponse } from 'next/server';
import { listPendingSyncs, markSyncProcessed, markSyncFailed, enqueueSync } from '@/lib/server/offline';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 50;
  const syncs = listPendingSyncs(limit);
  return NextResponse.json({ syncs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entityType, entityReference, action, payload } = body;
    enqueueSync(entityType, entityReference, action, payload);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}