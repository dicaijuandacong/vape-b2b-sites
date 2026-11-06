import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrderStats } from '../api/types';

/**
 * 订单 KPI 卡片行：订单数 / 下单数量 / GMV(€) / 利润(¥)。
 * 纯展示组件，数据来自 lib/orders.ts 的 computeOrderStats（服务端算好传入）。
 */

const eurFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});

const cnyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('zh-CN');

interface KpiCardProps {
  title: string;
  value: string;
  hint: string;
}

function KpiCard({ title, value, hint }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tracking-tight'>{value}</div>
        <p className='text-muted-foreground mt-1 text-xs'>{hint}</p>
      </CardContent>
    </Card>
  );
}

export function OrdersKpiCards({ stats }: { stats: OrderStats }) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
      <KpiCard
        title='订单数'
        value={numberFormatter.format(stats.orderCount)}
        hint='不含已取消订单'
      />
      <KpiCard
        title='下单数量'
        value={`${numberFormatter.format(stats.totalQty)} 件`}
        hint='所有有效订单的总件数'
      />
      <KpiCard
        title='GMV'
        value={eurFormatter.format(stats.gmvEur)}
        hint='总金额按固定汇率折算为欧元'
      />
      <KpiCard
        title='利润'
        value={stats.hasProfitData ? cnyFormatter.format(stats.profitCny) : '—'}
        hint={stats.hasProfitData ? '按人民币汇总（录入成本/利润的订单）' : '录入成本或利润后显示'}
      />
    </div>
  );
}
