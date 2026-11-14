import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/server/audit';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const logs = listAuditLogs({
    entityType: url.searchParams.get('entityType') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 100,
  });
  return NextResponse.json({ logs });
}
