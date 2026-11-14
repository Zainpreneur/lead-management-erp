import { NextResponse } from 'next/server';
import { createImportJob } from '@/lib/server/platform';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const job = createImportJob(body);
    return NextResponse.json({ job }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  const { listImportJobs } = await import('@/lib/server/platform');
  const jobs = listImportJobs();
  return NextResponse.json({ jobs });
}