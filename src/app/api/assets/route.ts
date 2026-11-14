import { NextResponse } from 'next/server';
import { listAssets, createAsset } from '@/lib/server/assets';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const assets = listAssets({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    businessReference: url.searchParams.get('businessReference') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
    page: url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined,
  });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const asset = createAsset(body);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}