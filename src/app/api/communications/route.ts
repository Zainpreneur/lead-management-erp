import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { listCommunications, createCommunication } from '@/lib/server/businessCommunications';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'communications:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const businessRef = url.searchParams.get('businessReference');
  if (!businessRef) {
    return NextResponse.json({ error: 'businessReference required' }, { status: 400 });
  }
  const communications = listCommunications(businessRef);
  return NextResponse.json({ communications });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'communications:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const communication = createCommunication(body);
    return NextResponse.json({ communication }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}