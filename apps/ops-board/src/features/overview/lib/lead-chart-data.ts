import { cache } from 'react';

import { getLeads } from '@/lib/leads';
import {
  LEAD_STATUSES,
  SITE_KEYS,
  SITE_LABELS,
  type Lead,
  type LeadSite,
  type LeadStatus,
  type LeadsResponse
} from '@/features/kanban/api/types';

/**
 * 总览页图表数据聚合层。
 *
 * 4 个 parallel-route slot + OpsStats 都需要询盘列表；用 React cache()
 * 保证同一次请求只拉一次飞书，其余调用命中内存缓存。
 */
export const getOverviewLeads = cache(async (): Promise<LeadsResponse> => getLeads());

// ---------- 漏斗状态分布（饼图） ----------

/** 状态 → 饼图 config key（用 ASCII key，避免生成的 CSS 变量名出现中文）。 */
export const STATUS_CHART_KEYS: Record<LeadStatus, string> = {
  新询盘: 'new',
  已联系: 'contacted',
  已报价: 'quoted',
  样品单: 'sample',
  成交: 'won',
  流失: 'lost',
  待跟进: 'followup'
};

export interface StatusSlice {
  key: string;
  count: number;
}

/** 按漏斗顺序统计 7 个状态的询盘数（保留 0 值，保证图例稳定）。 */
export function computeStatusDistribution(leads: Lead[]): StatusSlice[] {
  const counts = new Map<LeadStatus, number>();
  for (const lead of leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return LEAD_STATUSES.map((status) => ({
    key: STATUS_CHART_KEYS[status],
    count: counts.get(status) ?? 0
  }));
}

// ---------- 按站点分布（柱状图） ----------

export interface SiteBarPoint {
  site: LeadSite;
  label: string;
  count: number;
}

/** 四个站点各自的询盘数（保留 0 值，保证四根柱子都在）。 */
export function computeSiteDistribution(leads: Lead[]): SiteBarPoint[] {
  const counts: Record<LeadSite, number> = { dubai: 0, gulf: 0, europe: 0, vapegogogo: 0 };
  for (const lead of leads) {
    counts[lead.site] = (counts[lead.site] ?? 0) + 1;
  }
  return SITE_KEYS.map((site) => ({
    site,
    label: SITE_LABELS[site],
    count: counts[site]
  }));
}

// ---------- 近 14 天每日新询盘（面积图） ----------

export interface DailyLeadPoint {
  /** yyyy-MM-dd（服务器本地时区） */
  date: string;
  /** MM-DD，X 轴刻度 */
  label: string;
  count: number;
}

function localDayKey(d: Date): string {
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** 最近 days 天（含今天）的每日新询盘数；没有询盘的日期补 0。 */
export function computeDailyNewLeads(
  leads: Lead[],
  days = 14,
  now: Date = new Date()
): DailyLeadPoint[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(localDayKey(d), 0);
  }

  for (const lead of leads) {
    const created = new Date(lead.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const key = localDayKey(created);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([date, count]) => ({
    date,
    label: date.slice(5),
    count
  }));
}

/** 近 7 天 vs 前 7 天的环比（小数）；前一周为 0 时返回 null（不展示趋势角标）。 */
export function computeWeekOverWeekTrend(points: DailyLeadPoint[]): number | null {
  if (points.length < 14) return null;
  const split = points.length - 7;
  const prev = points.slice(0, split).reduce((sum, p) => sum + p.count, 0);
  const curr = points.slice(split).reduce((sum, p) => sum + p.count, 0);
  if (prev === 0) return null;
  return (curr - prev) / prev;
}

// ---------- 最新询盘（列表） ----------

/** 按创建时间倒序取前 limit 条。 */
export function getRecentLeads(leads: Lead[], limit = 6): Lead[] {
  return [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/** 中文相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / 具体日期。 */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const diffMs = Math.max(0, now - time);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const d = new Date(time);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
