import KanbanViewPage from '@/features/kanban/components/kanban-view-page';

export const metadata = {
  title: 'Dashboard : 询盘漏斗'
};

export const dynamic = 'force-dynamic';

export default function page() {
  return <KanbanViewPage />;
}
