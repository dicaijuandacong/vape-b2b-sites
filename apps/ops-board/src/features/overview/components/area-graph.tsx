'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

export interface DailyLeadPoint {
  date: string;
  label: string;
  count: number;
}

const chartConfig = {
  count: {
    label: '新询盘',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig;

interface AreaGraphProps {
  data?: DailyLeadPoint[];
  /** 近 7 天环比前 7 天（小数）；null 表示不展示趋势角标 */
  trend?: number | null;
}

export function AreaGraph({ data = [], trend = null }: AreaGraphProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          近 14 天新询盘
          {trend !== null && (
            <Badge variant='outline'>
              {trend >= 0 ? <Icons.trendingUp /> : <Icons.trendingDown />}
              {trend >= 0 ? '+' : ''}
              {(trend * 100).toFixed(0)}%
            </Badge>
          )}
        </CardTitle>
        <CardDescription>每日新增询盘数（按创建时间，环比上周）</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='label' tickLine={false} axisLine={false} tickMargin={8} interval={1} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='count'
              type='natural'
              fill='url(#dotted-background-pattern-count)'
              fillOpacity={0.4}
              stroke='var(--color-count)'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='5' cy='5' r='1.5' fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};
