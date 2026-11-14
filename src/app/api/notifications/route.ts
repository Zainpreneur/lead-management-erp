import { NextResponse } from 'next/server';
import { listNotifications, createNotification } from '@/lib/server/automation';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const notifications = listNotifications({
    isRead: url.searchParams.get('isRead') ? url.searchParams.get('isRead') === 'true' : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notification = createNotification(body);
    return NextResponse.json({ notification }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}