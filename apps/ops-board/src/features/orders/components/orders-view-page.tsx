import PageContainer from '@/components/layout/page-container';
import { computeOrderStats, getOrders } from '@/lib/orders';
import { NewOrderDialog, type NewOrderPrefill } from './new-order-dialog';
import { OrdersKpiCards } from './orders-kpi-cards';
import { OrdersTable } from './orders-table';

interface OrdersViewPageProps {
  /** 从询盘详情页「转为订单」跳转时自动打开新建弹窗并预填 */
  createDialogOpen?: boolean;
  prefill?: NewOrderPrefill;
}

export default async function OrdersViewPage({ createDialogOpen, prefill }: OrdersViewPageProps) {
  const { orders, source } = await getOrders();
  const stats = computeOrderStats(orders);

  return (
    <PageContainer
      pageTitle='订单'
      pageDescription='订单、GMV 与利润总览；成交后点「新建订单」记一笔，或从询盘详情一键转化'
      pageHeaderAction={<NewOrderDialog defaultOpen={createDialogOpen} prefill={prefill} />}
    >
      <div className='flex flex-1 flex-col gap-4'>
        <OrdersKpiCards stats={stats} />
        <OrdersTable orders={orders} source={source} />
      </div>
    </PageContainer>
  );
}
