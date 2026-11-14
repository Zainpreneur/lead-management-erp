import { NextResponse } from 'next/server';
import { markSyncProcessed, markSyncFailed } from '@/lib/server/offline';
import db from '@/lib/server/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.status === 'processed') {
      markSyncProcessed(Number(id));
    } else if (body.status === 'failed') {
      markSyncFailed(Number(id));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    db.prepare('DELETE FROM sync_queue WHERE id = ?').run(Number(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}