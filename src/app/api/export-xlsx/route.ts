import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'XLSX export not available. Please install the xlsx package.' },
    { status: 501 }
  );
}