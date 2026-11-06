import { getOverviewLeads } from './lead-chart-data';
import { SITE_LABELS, type Lead, type LeadSite } from '@/features/kanban/api/types';

export interface OpsKpis {
  total: number;
  newToday: number;
  activePipeline: number; // not won/lost
  won: number;
  lost: number;
  conversionRate: number; // won / (won+lost), 0-1
  perSite: Record<LeadSite, number>;
  source: 'feishu' | 'mock';
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function computeOpsKpis(now: Date = new Date()): Promise<OpsKpis> {
  const { leads, source } = await getOverviewLeads();
  let newToday = 0,
    won = 0,
    lost = 0,
    active = 0;
  const perSite: Record<LeadSite, number> = { dubai: 0, gulf: 0, europe: 0, vapegogogo: 0 };
  for (const l of leads as Lead[]) {
    perSite[l.site] = (perSite[l.site] ?? 0) + 1;
    if (sameDay(new Date(l.createdAt), now)) newToday++;
    if (l.status === '成交') won++;
    else if (l.status === '流失') lost++;
    else active++;
  }
  const decided = won + lost;
  return {
    total: leads.length,
    newToday,
    activePipeline: active,
    won,
    lost,
    conversionRate: decided === 0 ? 0 : won / decided,
    perSite,
    source
  };
}

export { SITE_LABELS };
