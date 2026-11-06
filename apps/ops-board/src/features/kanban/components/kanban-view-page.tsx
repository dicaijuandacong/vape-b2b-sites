import PageContainer from '@/components/layout/page-container';
import { getLeads } from '@/lib/leads';
import { KanbanBoard } from './kanban-board';
import { RefreshLeadsButton } from './refresh-leads-button';

export default async function KanbanViewPage() {
  const { leads, source } = await getLeads();

  return (
    <PageContainer
      pageTitle='询盘漏斗'
      pageDescription='四个站点的批发询盘与订阅线索，拖拽卡片即可更新跟进状态'
      pageHeaderAction={<RefreshLeadsButton />}
    >
      <KanbanBoard initialLeads={leads} source={source} />
    </PageContainer>
  );
}
