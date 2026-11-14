import { NextResponse } from 'next/server';
import { listTimeEntries, createTimeEntry } from '@/lib/server/workforce';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const entries = listTimeEntries({
    employeeReference: url.searchParams.get('employeeReference') || undefined,
    projectReference: url.searchParams.get('projectReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = createTimeEntry(body);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}