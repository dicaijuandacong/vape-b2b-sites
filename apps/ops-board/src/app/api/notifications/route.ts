import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/leads';
import { getFollowupTasks, getTaskUrgency } from '@/lib/followups';
import { isAnySourceMock } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

/** 通知中心数据：24h 内新询盘 + 逾期/今日待跟进，供顶栏铃铛徽章用。 */

// 错误态统一返回 200 + { error: true, counts: null }：让铃铛能区分
// 「数据源异常」和「真的 0 条」，而不是把假 0 当成「都处理完了」。
const ERROR_PAYLOAD = { error: true, counts: null } as const;

export async function GET() {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    const [{ leads, source: leadsSource }, { tasks, source: tasksSource }] = await Promise.all([
      getLeads(),
      getFollowupTasks()
    ]);

    // mock 数据不得冒充真数据：飞书不可用时回退 mock，待办数是假的，
    // 返回异常态让铃铛显示「数据源异常」而非假计数。
    if (isAnySourceMock(leadsSource, tasksSource)) {
      console.error('[api/notifications] 数据源为 mock（飞书凭证或表不可用），返回异常态');
      return NextResponse.json(ERROR_PAYLOAD);
    }

    const newLeads = leads.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return !Number.isNaN(t) && now - t < DAY && l.status === '新询盘';
    });
    const overdue = tasks.filter((t) => getTaskUrgency(t.dueAt) === 'overdue');
    const today = tasks.filter((t) => getTaskUrgency(t.dueAt) === 'today');

    return NextResponse.json({
      newLeadsCount: newLeads.length,
      overdueCount: overdue.length,
      todayCount: today.length,
      total: newLeads.length + overdue.length + today.length,
      newLeads: newLeads.slice(0, 5).map((l) => ({
        id: l.id,
        label: l.company ?? l.email,
        site: l.site
      })),
      overdue: overdue.slice(0, 5).map((t) => ({ leadId: t.leadId, label: t.company ?? t.email })),
      today: today.slice(0, 5).map((t) => ({ leadId: t.leadId, label: t.company ?? t.email }))
    });
  } catch (e) {
    console.error('[api/notifications] failed:', e instanceof Error ? e.message : 'unknown');
    // 出错不装正常：返回 error 态，铃铛显示「数据源异常」而不是假 0。
    return NextResponse.json(ERROR_PAYLOAD);
  }
}
