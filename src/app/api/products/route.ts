import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/rbac';
import { z } from 'zod';
import { listProducts, createProduct } from '@/lib/server/products';
import { logAudit } from '@/lib/server/audit';

export async function GET(request: Request) {
  const { error } = requirePermission(request, 'products:read');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  const url = new URL(request.url);
  const products = listProducts({
    search: url.searchParams.get('search') || undefined,
    status: url.searchParams.get('status') || undefined,
    limit: url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined,
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const { error } = requirePermission(request, 'products:write');
  if (error) return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  try {
    const body = await request.json();
    const product = createProduct(body);
    try { await logAudit('product', product.reference, 'created', `Product ${product.name} created`); } catch (e) { console.error(e); }
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
