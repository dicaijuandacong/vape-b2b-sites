import { BarGraph } from '@/features/overview/components/bar-graph';
import {
  computeSiteDistribution,
  getOverviewLeads
} from '@/features/overview/lib/lead-chart-data';

export default async function BarStats() {
  const { leads } = await getOverviewLeads();
  return <BarGraph data={computeSiteDistribution(leads)} total={leads.length} />;
}
