'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export interface StatusSlice {
  key: string;
  count: number;
}

const chartConfig = {
  count: {
    label: '询盘数'
  },
  new: {
    label: '新询盘',
    color: 'var(--chart-1)'
  },
  contacted: {
    label: '已联系',
    color: 'var(--chart-2)'
  },
  quoted: {
    label: '已报价',
    color: 'var(--chart-3)'
  },
  sample: {
    label: '样品单',
    color: 'var(--chart-4)'
  },
  won: {
    label: '成交',
    color: 'var(--chart-5)'
  },
  lost: {
    label: '流失',
    color: 'var(--muted-foreground)'
  },
  followup: {
    label: '待跟进',
    color: 'color-mix(in oklab, var(--chart-2) 55%, var(--muted-foreground))'
  }
} satisfies ChartConfig;

interface PieGraphProps {
  data?: StatusSlice[];
  total?: number;
}

export function PieGraph({ data = [], total = 0 }: PieGraphProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: `var(--color-${item.key})`
  }));

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>漏斗状态分布</CardTitle>
        <CardDescription>全部询盘 · 共 {total} 条</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        {total === 0 ? (
          <div className='text-muted-foreground flex min-h-[250px] items-center justify-center text-sm'>
            暂无询盘数据
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey='key' hideLabel />} />
              <Pie
                data={chartData}
                innerRadius={30}
                dataKey='count'
                radius={10}
                cornerRadius={8}
                paddingAngle={4}
              >
                <LabelList
                  dataKey='count'
                  stroke='none'
                  fontSize={12}
                  fontWeight={500}
                  fill='currentColor'
                  formatter={(value) => (Number(value) > 0 ? String(value) : '')}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey='key' className='flex-wrap gap-x-3 gap-y-1' />}
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
