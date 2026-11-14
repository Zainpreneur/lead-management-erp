import { NextResponse } from 'next/server';
import { listPeople } from '@/lib/server/leads';

export async function GET() {
  return NextResponse.json({ people: listPeople() });
}