import { NextResponse } from 'next/server';
import { listAssetMaintenance, createAssetMaintenance } from '@/lib/server/assets';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assetRef = url.searchParams.get('assetReference');
  if (!assetRef) {
    return NextResponse.json({ error: 'assetReference required' }, { status: 400 });
  }
  const maintenance = listAssetMaintenance(assetRef);
  return NextResponse.json({ maintenance });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const maintenance = createAssetMaintenance(body);
    return NextResponse.json({ maintenance }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}