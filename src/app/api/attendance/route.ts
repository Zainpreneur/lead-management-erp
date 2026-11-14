import { NextResponse } from 'next/server';
import { listAttendance, createAttendance } from '@/lib/server/workforce';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const attendance = listAttendance({
    employeeReference: url.searchParams.get('employeeReference') || undefined,
    date: url.searchParams.get('date') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ attendance });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const att = createAttendance(body);
    return NextResponse.json({ attendance: att }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}