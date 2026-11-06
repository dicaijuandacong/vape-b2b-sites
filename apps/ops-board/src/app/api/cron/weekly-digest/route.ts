import { NextRequest, NextResponse } from 'next/server';
import { getLeads } from '@/lib/leads';
import { getOrders } from '@/lib/orders';
import { getFollowupTasks, getTaskUrgency } from '@/lib/followups';
import { isAnySourceMock } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

/**
 * 周一 9 点（Asia/Shanghai）周简报：Vercel cron 调 /api/cron/weekly-digest。
 * CRON_SECRET 校验（Vercel 自动带 Authorization: Bearer <CRON_SECRET>）。
 * 未配置 secret 时一律 403；未配置群 webhook 时静默跳过推送。
 */

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function escMd(s: string): string {
  return s.replace(/[[\]*_~`|()\\]/g, '\\$1');
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const now = Date.now();
    const [
      { leads, source: leadsSource },
      { orders, source: ordersSource },
      { tasks, source: tasksSource }
    ] = await Promise.all([getLeads(), getOrders(), getFollowupTasks()]);

    // mock 数据不得冒充真数据：任一数据源回退 mock（飞书凭证/表不可用）时，
    // 推出去的 GMV / 询盘数全是假的 —— 直接跳过本次推送。
    // 返回 200 {skipped} 而非 5xx，避免 Vercel cron 反复重试。
    if (isAnySourceMock(leadsSource, ordersSource, tasksSource)) {
      console.error('周报跳过：数据源为 mock（飞书凭证或表不可用）');
      return NextResponse.json({ skipped: true, reason: 'mock-source' });
    }

    const weekNew = leads.filter((l) => now - new Date(l.createdAt).getTime() < WEEK_MS);
    const weekWon = leads.filter(
      (l) => l.status === '成交' && now - new Date(l.createdAt).getTime() < WEEK_MS
    );
    const weekOrders = orders.filter((o) => now - new Date(o.createdAt).getTime() < WEEK_MS);
    const gmv = weekOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    const profit = weekOrders.reduce((sum, o) => sum + (o.profit ?? 0), 0);
    const overdue = tasks.filter((t) => getTaskUrgency(t.dueAt) === 'overdue').length;
    const today = tasks.filter((t) => getTaskUrgency(t.dueAt) === 'today').length;

    const siteCount = new Map<string, number>();
    for (const l of weekNew) siteCount.set(l.site, (siteCount.get(l.site) ?? 0) + 1);
    const siteLine = [...siteCount.entries()].map(([s, n]) => `${s} ${n}`).join(' · ') || '无新增';

    const webhook = process.env.FEISHU_BOT_WEBHOOK;
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'interactive',
          card: {
            header: {
              title: { tag: 'plain_text', content: '📊 周简报（过去 7 天）' },
              template: 'blue'
            },
            elements: [
              {
                tag: 'div',
                fields: [
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**新增询盘**\n${weekNew.length} 条` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**成交**\n${weekWon.length} 条` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**订单**\n${weekOrders.length} 单` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**GMV**\n${gmv.toLocaleString()} 元` }
                  }
                ]
              },
              {
                tag: 'div',
                fields: [
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**利润**\n${profit.toLocaleString()} 元` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**逾期跟进**\n${overdue} 条` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**今日待办**\n${today} 条` }
                  },
                  {
                    is_short: true,
                    text: { tag: 'lark_md', content: `**分站点新增**\n${escMd(siteLine)}` }
                  }
                ]
              },
              { tag: 'hr' },
              {
                tag: 'note',
                elements: [
                  {
                    tag: 'plain_text',
                    content: `周一早上好！${overdue > 0 ? `有 ${overdue} 条逾期跟进，今天先清掉。` : '没有逾期跟进，保持节奏。'}`
                  }
                ]
              }
            ]
          }
        })
      });
    }

    return NextResponse.json({
      ok: true,
      weekNew: weekNew.length,
      weekWon: weekWon.length,
      orders: weekOrders.length,
      gmv,
      profit,
      overdue,
      today
    });
  } catch (e) {
    console.error('[cron/weekly-digest] failed:', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'digest failed' }, { status: 502 });
  }
}
