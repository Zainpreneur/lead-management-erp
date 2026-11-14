import { NextResponse } from 'next/server';
import { invoiceSummary } from '@/lib/server/invoices';

export async function GET() {
  return NextResponse.json({ summary: invoiceSummary() });
}