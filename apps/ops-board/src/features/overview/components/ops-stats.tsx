import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeOpsKpis } from '../lib/ops-kpis';

/** Real ops KPIs from Feishu leads (replaces the template's fake revenue cards). */
export async function OpsStats() {
  const k = await computeOpsKpis();
  const cards = [
    { label: '今日新询盘', value: String(k.newToday), sub: '四站合计' },
    { label: '在跟管道', value: String(k.activePipeline), sub: '未成交/未流失' },
    { label: '成交', value: String(k.won), sub: `转化率 ${(k.conversionRate * 100).toFixed(0)}%` },
    {
      label: '总询盘',
      value: String(k.total),
      sub: `Dubai ${k.perSite.dubai} · Gulf ${k.perSite.gulf} · EU ${k.perSite.europe} · GoGoGo ${k.perSite.vapegogogo}`
    }
  ];
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between px-4 lg:px-6'>
        <span className='text-xs text-muted-foreground'>询盘数据</span>
        <Badge variant={k.source === 'feishu' ? 'default' : 'secondary'}>
          {k.source === 'feishu' ? '飞书实时' : '本地 mock'}
        </Badge>
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums'>{c.value}</CardTitle>
            </CardHeader>
            <div className='px-6 pb-4 text-xs text-muted-foreground'>{c.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
