import { NextRequest, NextResponse } from 'next/server';
import { getLeadFollowupSchedule, scheduleFollowupReminder } from '@/lib/calendar';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

interface SyncBody {
  /** ISO 时间；缺省时读取 Bitable 上的「下次跟进日期」。 */
  dueAt?: unknown;
  title?: unknown;
  leadLabel?: unknown;
  notes?: unknown;
}

/**
 * 手动「同步到飞书日历」：为询盘的下次跟进日期创建日历日程。
 * 全程 fail-soft —— scope/环境缺失也返回 200 + { synced:false, reason }，
 * 由前端 toast 提示，不影响跟进主流程。
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: SyncBody = {};
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    // 允许空 body：回落到读取 Bitable 上的「下次跟进日期」
  }

  let dueAt = typeof body.dueAt === 'string' ? body.dueAt : '';
  if (!dueAt) {
    const schedule = await getLeadFollowupSchedule(id);
    dueAt = schedule.nextFollowAt ?? '';
  }
  if (!dueAt) {
    return NextResponse.json(
      { synced: false, reason: '缺少下次跟进日期，请先设置跟进时间' },
      { status: 400 }
    );
  }

  const result = await scheduleFollowupReminder(id, dueAt, {
    title: typeof body.title === 'string' ? body.title : undefined,
    leadLabel: typeof body.leadLabel === 'string' ? body.leadLabel : undefined,
    notes: typeof body.notes === 'string' ? body.notes : undefined,
    force: true // 手动同步不受 FEISHU_CALENDAR_AUTOSYNC=off 限制
  });

  if (result.synced && !result.alreadySynced) {
    await recordAudit('lead.followup.calendar_sync', id, `日历日程 ${result.eventId}`);
  }
  return NextResponse.json(result);
}
