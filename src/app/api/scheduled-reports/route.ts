import { NextResponse } from 'next/server';
import { listScheduledReports, createScheduledReport } from '@/lib/server/automation';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reports = listScheduledReports({
    isActive: url.searchParams.get('isActive') ? url.searchParams.get('isActive') === 'true' : undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const report = createScheduledReport(body);
    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}