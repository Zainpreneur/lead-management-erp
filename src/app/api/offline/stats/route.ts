import { NextResponse } from 'next/server';
import { getSyncStats } from '@/lib/server/offline';

export async function GET() {
  const stats = getSyncStats();
  return NextResponse.json({ stats });
}