import { NextResponse } from 'next/server';
import { leadSummary } from '@/lib/server/leads';

export async function GET() {
  return NextResponse.json({ summary: leadSummary() });
}