import { NextRequest, NextResponse } from 'next/server';
import { createOrder, getOrders } from '@/lib/orders';
import { recordAudit } from '@/lib/audit';
import { SITE_KEYS } from '@/features/kanban/api/types';
import {
  isOrderCurrency,
  isOrderStatus,
  type CreateOrderInput,
  type OrderItem
} from '@/features/orders/api/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await getOrders();
  return NextResponse.json(result);
}

/** 校验并规范化一行商品；不合法返回 null。 */
function parseItem(raw: unknown): OrderItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const model = typeof record.model === 'string' ? record.model.trim() : '';
  const qty = Number(record.qty);
  const unitPrice = Number(record.unitPrice);
  if (!model || !Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) return null;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;
  const productId =
    typeof record.productId === 'string' && record.productId.trim()
      ? record.productId.trim()
      : undefined;
  return { model, qty, unitPrice, ...(productId ? { productId } : {}) };
}

/** 新建订单（飞书 Bitable orders 表；未配置时落本地 mock 文件）。 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const customer = typeof raw.customer === 'string' ? raw.customer.trim() : '';
  if (!customer) {
    return NextResponse.json({ error: 'customer is required' }, { status: 400 });
  }
  const site = typeof raw.site === 'string' ? raw.site.trim().toLowerCase() : '';
  if (!(SITE_KEYS as readonly string[]).includes(site)) {
    return NextResponse.json({ error: 'invalid site' }, { status: 400 });
  }
  if (!isOrderCurrency(raw.currency)) {
    return NextResponse.json({ error: 'invalid currency' }, { status: 400 });
  }
  if (!isOrderStatus(raw.status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  if (!Array.isArray(raw.items) || raw.items.length === 0) {
    return NextResponse.json({ error: 'items is required' }, { status: 400 });
  }
  const items: OrderItem[] = [];
  for (const rawItem of raw.items) {
    const item = parseItem(rawItem);
    if (!item) {
      return NextResponse.json({ error: 'invalid item row' }, { status: 400 });
    }
    items.push(item);
  }

  const input: CreateOrderInput = {
    customer,
    site: site as CreateOrderInput['site'],
    currency: raw.currency,
    status: raw.status,
    items
  };
  if (typeof raw.leadId === 'string' && raw.leadId.trim()) input.leadId = raw.leadId.trim();
  if (typeof raw.country === 'string' && raw.country.trim()) input.country = raw.country.trim();
  if (typeof raw.cost === 'number' && Number.isFinite(raw.cost) && raw.cost >= 0) {
    input.cost = raw.cost;
  }
  if (typeof raw.paidAt === 'string' && raw.paidAt.trim()) input.paidAt = raw.paidAt.trim();

  try {
    const result = await createOrder(input);
    await recordAudit('order.create', result.id, `客户 ${customer} · ${items.length} 行商品`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/orders] create failed:', error);
    return NextResponse.json({ error: 'failed to create order' }, { status: 502 });
  }
}
