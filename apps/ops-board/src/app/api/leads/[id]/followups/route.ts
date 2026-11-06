import { NextRequest, NextResponse } from 'next/server';
import { addFollowup, FOLLOW_CHANNEL_LABELS, isFollowChannel } from '@/lib/followups';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** 详情页「记一笔」/ 一键触达自动记录 → 写入飞书 Bitable followups 表。 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const channel = payload?.channel;
  if (!isFollowChannel(channel)) {
    return NextResponse.json({ error: 'invalid channel' }, { status: 400 });
  }

  const content = typeof payload.content === 'string' ? payload.content.trim() : '';
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const nextAction =
    typeof payload.nextAction === 'string' && payload.nextAction.trim()
      ? payload.nextAction.trim()
      : undefined;

  let nextFollowAt: string | undefined;
  if (typeof payload.nextFollowAt === 'string' && payload.nextFollowAt.trim()) {
    const parsed = new Date(payload.nextFollowAt.trim());
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'invalid nextFollowAt' }, { status: 400 });
    }
    nextFollowAt = parsed.toISOString();
  }

  try {
    const result = await addFollowup({
      leadId: id,
      channel,
      content,
      ...(nextAction ? { nextAction } : {}),
      ...(nextFollowAt ? { nextFollowAt } : {}),
      // 可选：公司名/邮箱，用于飞书日历日程标题（日历同步在 addFollowup 内部 fail-soft 触发）
      ...(typeof (payload as { leadLabel?: unknown }).leadLabel === 'string'
        ? { leadLabel: (payload as { leadLabel: string }).leadLabel }
        : {})
    });
    await recordAudit(
      'lead.followup.create',
      id,
      `${FOLLOW_CHANNEL_LABELS[channel]}：${content.slice(0, 50)}`
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[api/leads/followups] create failed:', error);
    return NextResponse.json({ error: 'failed to create followup' }, { status: 502 });
  }
}
