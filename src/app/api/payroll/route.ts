import { NextResponse } from 'next/server';
import { listPayroll, createPayroll } from '@/lib/server/workforce';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payroll = listPayroll({
    employeeReference: url.searchParams.get('employeeReference') || undefined,
    status: url.searchParams.get('status') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ payroll });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pay = createPayroll(body);
    return NextResponse.json({ payroll: pay }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}