import { NextResponse } from 'next/server';
import { listAssetsByVendor } from '@/lib/server/assets';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vendorRef: string }> }
) {
  const { vendorRef } = await params;
  const assets = listAssetsByVendor(decodeURIComponent(vendorRef));
  return NextResponse.json({ assets });
}