import { NextRequest, NextResponse } from 'next/server';
import { updateLeadStatus } from '@/lib/leads';
import { recordAudit } from '@/lib/audit';
import { isLeadStatus } from '@/features/kanban/api/types';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** 拖拽看板卡片 → 更新飞书 Bitable「状态」字段。 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (!isLeadStatus(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  try {
    const result = await updateLeadStatus(id, status);
    await recordAudit('lead.status.update', id, `状态 → ${status}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/leads] update status failed:', error);
    return NextResponse.json({ error: 'failed to update lead status' }, { status: 502 });
  }
}
