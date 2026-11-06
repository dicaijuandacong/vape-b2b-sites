// ============================================================
// Route Handler — Single Product (get + update + soft delete)
// ============================================================
// Backed by `@/lib/catalog` (master catalog + local override file).
// DELETE is a soft delete: the SKU stays in the catalog with
// `active: false` (下架) instead of being removed.
// DELETE / 部署属于危险操作，仅管理员；POST/PUT 运营可执行。
// ============================================================

import {
  findProductById,
  updateCatalogProduct,
  deleteCatalogProduct,
  type CatalogMutationInput
} from '@/lib/catalog';
import { recordAudit } from '@/lib/audit';
import { requireAdmin } from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const data = await findProductById(id);

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as CatalogMutationInput;
  const data = await updateCatalogProduct(id, body);

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  await recordAudit('product.update', id, `${body.brand} ${body.model}`);
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const data = await deleteCatalogProduct(id);

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  await recordAudit('product.delete', id, '下架（soft delete）');
  return NextResponse.json(data);
}
