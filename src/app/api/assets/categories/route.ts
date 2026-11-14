import { NextResponse } from 'next/server';
import { listAssetCategories, createAssetCategory } from '@/lib/server/assets';

export async function GET() {
  const categories = listAssetCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = createAssetCategory(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}