import { PieGraph } from '@/features/overview/components/pie-graph';
import {
  computeStatusDistribution,
  getOverviewLeads
} from '@/features/overview/lib/lead-chart-data';

export default async function Stats() {
  const { leads } = await getOverviewLeads();
  return <PieGraph data={computeStatusDistribution(leads)} total={leads.length} />;
}
