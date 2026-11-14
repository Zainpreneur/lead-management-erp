import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { getUtilizationReport } from '@/lib/server/resourcePlanning';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'resources:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate') || new Date().toISOString().slice(0, 10);
  const endDate = url.searchParams.get('endDate') || new Date().toISOString().slice(0, 10);
  const report = getUtilizationReport(startDate, endDate);
  return NextResponse.json({ report });
}