import { NextRequest, NextResponse } from 'next/server';
import { updateProspectStatus } from '@/lib/prospects';
import { recordAudit } from '@/lib/audit';
import { isProspectStatus } from '@/lib/prospects';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** 外呼清单改「外呼状态」→ 写回飞书 Bitable prospects 表。 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== 'string' || !isProspectStatus(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  try {
    const result = await updateProspectStatus(id, status);
    await recordAudit('prospect.status.update', id, `外呼状态 → ${status}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[api/prospects] update status failed:', error);
    return NextResponse.json({ error: 'failed to update prospect status' }, { status: 502 });
  }
}
