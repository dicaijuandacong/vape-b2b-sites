// ============================================================
// Route Handler — 单站上下架（per-site listing override）
// ============================================================
// POST { productId, site, listed } → 写入 data/site-listings.json。
// 站点覆盖叠加在全局 active 之上：无覆盖的站点继承全局状态。
// 与 PUT /api/products/[id] 同级（运营可执行），不写 requireAdmin。
// ============================================================

import { setCatalogSiteListing } from '@/lib/catalog';
import { recordAudit } from '@/lib/audit';
import { isListingSite, LISTING_SITES } from '@/lib/site-listing-shared';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SiteListingPayload {
  productId?: unknown;
  site?: unknown;
  listed?: unknown;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SiteListingPayload;

  if (typeof body.productId !== 'string' || !body.productId.trim()) {
    return NextResponse.json({ success: false, message: '缺少 productId' }, { status: 400 });
  }
  if (!isListingSite(body.site)) {
    return NextResponse.json(
      { success: false, message: '非法站点（仅 dubai / gulf / europe）' },
      { status: 400 }
    );
  }
  if (typeof body.listed !== 'boolean') {
    return NextResponse.json({ success: false, message: 'listed 必须是布尔值' }, { status: 400 });
  }

  const productId = body.productId.trim();
  const data = await setCatalogSiteListing(productId, body.site, body.listed);

  if (!data.success) {
    return NextResponse.json(data, { status: 404 });
  }

  const siteLabel = LISTING_SITES.find((s) => s.key === body.site)?.label ?? body.site;
  await recordAudit(
    'product.site_listing',
    productId,
    `${siteLabel}站 ${body.listed ? '上架' : '下架'}`
  );

  return NextResponse.json(data);
}
