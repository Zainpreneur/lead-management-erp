import { NextResponse } from 'next/server';
import { getAssetByIdOrRef, updateAsset, deleteAsset, deployAsset, maintainAsset, disposeAsset, loseAsset } from '@/lib/server/assets';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = getAssetByIdOrRef(decodeURIComponent(id));
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ asset });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    if (body.action === 'deploy') {
      const asset = deployAsset(decodeURIComponent(id), body.assignedTo, body.assignedBranch, body.reason);
      return NextResponse.json({ asset });
    }
    if (body.action === 'maintain') {
      const asset = maintainAsset(decodeURIComponent(id), body.reason);
      return NextResponse.json({ asset });
    }
    if (body.action === 'dispose') {
      const asset = disposeAsset(decodeURIComponent(id), body.reason);
      return NextResponse.json({ asset });
    }
    if (body.action === 'lose') {
      const asset = loseAsset(decodeURIComponent(id), body.reason);
      return NextResponse.json({ asset });
    }
    const asset = updateAsset(decodeURIComponent(id), body);
    return NextResponse.json({ asset });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    deleteAsset(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}