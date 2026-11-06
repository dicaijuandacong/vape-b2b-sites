import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/orders';
import { recordAudit } from '@/lib/audit';
import { isOrderStatus } from '@/features/orders/api/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** 订单表格「改状态」→ 更新飞书 Bitable「状态」字段。 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (!isOrderStatus(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  try {
    const result = await updateOrderStatus(id, status);
    await recordAudit('order.status.update', id, `状态 → ${status}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/orders] update status failed:', error);
    return NextResponse.json({ error: 'failed to update order status' }, { status: 502 });
  }
}
