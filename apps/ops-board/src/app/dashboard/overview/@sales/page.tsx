import { RecentSales } from '@/features/overview/components/recent-sales';
import { getOverviewLeads, getRecentLeads } from '@/features/overview/lib/lead-chart-data';

export default async function Sales() {
  const { leads, source } = await getOverviewLeads();
  return <RecentSales leads={getRecentLeads(leads, 6)} source={source} />;
}
