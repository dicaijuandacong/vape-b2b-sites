import { AreaGraph } from '@/features/overview/components/area-graph';
import {
  computeDailyNewLeads,
  computeWeekOverWeekTrend,
  getOverviewLeads
} from '@/features/overview/lib/lead-chart-data';

export default async function AreaStats() {
  const { leads } = await getOverviewLeads();
  const data = computeDailyNewLeads(leads, 14);
  return <AreaGraph data={data} trend={computeWeekOverWeekTrend(data)} />;
}
