'use client';

/**
 * 外呼批量连打模式：一键生成「S/A 级 + 未触达 + 有电话」队列，
 * 运营从上往下打，每完成一家（改状态）自动滚到下一家。
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { Prospect, ProspectStatus } from '@/lib/prospects';
import { ProspectStatusSelect } from './prospect-status-select';
import { cn } from '@/lib/utils';

interface BatchCallerProps {
  prospects: Prospect[];
  countryFilter?: string;
}

export function BatchCaller({ prospects, countryFilter }: BatchCallerProps) {
  const [started, setStarted] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const queue = useMemo(() => {
    return prospects.filter((p) => {
      if (countryFilter && p.country !== countryFilter) return false;
      if (p.status !== '未触达') return false;
      if (!p.phone) return false;
      return p.priority === 'S' || p.priority === 'A';
    });
  }, [prospects, countryFilter]);

  const remaining = queue.filter((p) => !doneIds.has(p.id));
  const current = remaining[0];
  const done = queue.length - remaining.length;

  if (!started) {
    return (
      <Card className='border-primary/30 bg-primary/5'>
        <CardContent className='flex flex-wrap items-center justify-between gap-3 py-4'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm font-semibold'>批量连打模式</span>
            <span className='text-muted-foreground text-xs'>
              {queue.length} 家 S/A 级未触达{countryFilter ? `（${countryFilter}）` : ''} ·
              从第一家开始，改状态自动跳下一家
            </span>
          </div>
          <Button onClick={() => setStarted(true)} disabled={queue.length === 0}>
            <Icons.arrowRight className='mr-2 h-4 w-4' /> 开始连打（{queue.length} 家）
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className='border-green-500/30 bg-green-50/50 dark:bg-green-950/20'>
        <CardContent className='flex items-center justify-between py-6'>
          <div className='flex items-center gap-2'>
            <Icons.circleCheck className='h-5 w-5 text-green-600' />
            <span className='text-sm font-semibold'>连打完成！共处理 {done} 家 S/A 级门店</span>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setStarted(false);
              setDoneIds(new Set());
            }}
          >
            再来一轮
          </Button>
        </CardContent>
      </Card>
    );
  }

  const waUrl = `https://wa.me/${current.phone.replace(/\D/g, '')}?text=${encodeURIComponent(current.opener || '')}`;

  return (
    <Card className='border-primary'>
      <CardContent className='flex flex-col gap-4 py-5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Badge variant='default' className='rounded-sm'>
              连打中
            </Badge>
            <span className='text-muted-foreground text-xs'>
              第 {done + 1} / {queue.length} 家 · 已完成 {done}
            </span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='text-xs'
            onClick={() => {
              setStarted(false);
              setDoneIds(new Set());
            }}
          >
            退出连打
          </Button>
        </div>

        <div className='flex flex-col gap-2 rounded-lg border border-border bg-card p-4'>
          <div className='flex items-center gap-2'>
            <Badge
              variant={current.priority === 'S' ? 'destructive' : 'secondary'}
              className='rounded-sm font-semibold'
            >
              {current.priority}
            </Badge>
            <span className='font-display text-xl font-semibold'>{current.name}</span>
          </div>
          <div className='text-muted-foreground text-sm'>
            {current.city} · {current.country} · {current.address}
          </div>
          {current.pain ? (
            <div className='text-xs text-red-600 dark:text-red-400'>痛点：{current.pain}</div>
          ) : null}
          {current.opener ? (
            <div className='bg-muted/50 rounded-lg p-3 text-sm leading-relaxed'>
              <span className='text-muted-foreground text-xs'>开场白（已自动填入 WhatsApp）：</span>
              <br />
              {current.opener}
            </div>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            size='lg'
            className='rounded-full'
            render={
              <a href={waUrl} target='_blank' rel='noreferrer'>
                <Icons.chat className='mr-2 h-4 w-4' /> 打开 WhatsApp（开场白已填）
              </a>
            }
          />
          <a
            href={`tel:${current.phone}`}
            className='text-muted-foreground text-sm hover:underline'
          >
            📞 {current.phone}
          </a>
        </div>

        <div className='flex flex-wrap items-center gap-2 border-t border-border pt-4'>
          <span className='text-muted-foreground text-xs'>联系完改成：</span>
          {(['已发WhatsApp', '已回复', '无兴趣', '无效'] as ProspectStatus[]).map((s) => (
            <Button
              key={s}
              variant='outline'
              size='sm'
              className={cn(
                'text-xs',
                s === '已回复' && 'border-green-500 text-green-700 dark:text-green-400'
              )}
              onClick={async () => {
                try {
                  await fetch(`/api/prospects/${current.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: s })
                  });
                } catch {
                  /* 状态即便没写上也先往下走，不让运营卡壳 */
                }
                setDoneIds((prev) => new Set(prev).add(current.id));
              }}
            >
              {s}
            </Button>
          ))}
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground text-xs'
            onClick={() => setDoneIds((prev) => new Set(prev).add(current.id))}
          >
            跳过这家 →
          </Button>
        </div>

        {remaining[1] ? (
          <div className='text-muted-foreground border-t border-border pt-3 text-xs'>
            下一家：{remaining[1].name}（{remaining[1].city}）
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
