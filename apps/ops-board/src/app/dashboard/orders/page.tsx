import OrdersViewPage from '@/features/orders/components/orders-view-page';
import type { NewOrderPrefill } from '@/features/orders/components/new-order-dialog';
import { getLeads } from '@/lib/leads';

export const metadata = {
  title: 'Dashboard : 订单'
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 订单总览页。
 * 支持 ?create=1&fromLead=<leadId>（询盘详情页「转为订单」跳转）：
 * 自动打开新建弹窗，并按询盘内容预填客户/国家/站点。
 */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const wantsCreate = params.create === '1';
  const fromLead = typeof params.fromLead === 'string' ? params.fromLead : undefined;

  let prefill: NewOrderPrefill | undefined;
  if (wantsCreate && fromLead) {
    const { leads } = await getLeads();
    const lead = leads.find((item) => item.id === fromLead);
    if (lead) {
      prefill = {
        leadId: lead.id,
        customer: lead.company ?? lead.email,
        site: lead.site,
        ...(lead.country ? { country: lead.country } : {})
      };
    }
  }

  return <OrdersViewPage createDialogOpen={wantsCreate} prefill={prefill} />;
}
