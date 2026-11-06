// ============================================================
// Route Handler — Products (list + create)
// ============================================================
// Backed by the real vape catalog: `@/lib/catalog` reads the master
// `sites/vape-europe/data/products.json` and merges local overrides from
// `ops-v2/data/catalog-override.json`. POST persists a new SKU into the
// override file.
// ============================================================

import { listProducts, createCatalogProduct, type CatalogMutationInput } from '@/lib/catalog';
import { recordAudit } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  const data = await listProducts({ page, limit, categories, search, sort, status });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CatalogMutationInput;
  const data = await createCatalogProduct(body);
  if (data.success) {
    await recordAudit('product.create', data.product.id, `${body.brand} ${body.model}`);
  }
  return NextResponse.json(data, { status: data.success ? 201 : 400 });
}
