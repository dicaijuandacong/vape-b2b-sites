'use client';

import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export interface SiteBarPoint {
  site: string;
  label: string;
  count: number;
}

const chartConfig = {
  count: {
    label: '询盘数'
  },
  dubai: {
    label: 'DubaiVape',
    color: 'var(--chart-1)'
  },
  gulf: {
    label: 'GulfVape',
    color: 'var(--chart-2)'
  },
  europe: {
    label: 'EuroVape',
    color: 'var(--chart-3)'
  },
  vapegogogo: {
    label: 'VapeGoGoGo',
    color: 'var(--chart-4)'
  }
} satisfies ChartConfig;

interface BarGraphProps {
  data?: SiteBarPoint[];
  total?: number;
}

export function BarGraph({ data = [], total = 0 }: BarGraphProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: `var(--color-${item.site})`
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>按站点分布</CardTitle>
        <CardDescription>四站询盘合计 {total} 条</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <rect
              x='0'
              y='0'
              width='100%'
              height='85%'
              fill='url(#default-multiple-pattern-dots)'
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis dataKey='label' tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' />} />
            <Bar dataKey='count' radius={4} maxBarSize={56}>
              {chartData.map((entry) => (
                <Cell key={entry.site} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = () => {
  return (
    <pattern
      id='default-multiple-pattern-dots'
      x='0'
      y='0'
      width='10'
      height='10'
      patternUnits='userSpaceOnUse'
    >
      <circle className='dark:text-muted/40 text-muted' cx='2' cy='2' r='1' fill='currentColor' />
    </pattern>
  );
};
