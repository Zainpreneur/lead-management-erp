import { NextResponse } from 'next/server';
import { customerSummary } from '@/lib/server/customers';

export async function GET() {
  return NextResponse.json({ summary: customerSummary() });
}