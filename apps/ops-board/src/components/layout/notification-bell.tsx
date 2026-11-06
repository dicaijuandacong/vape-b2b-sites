'use client';

/**
 * 顶栏通知铃铛：24h 新询盘 / 逾期跟进 / 今日待办 的徽章 + 下拉直达。
 * 每 60 秒轮询一次 /api/notifications。
 */

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface NotificationData {
  /** 数据源异常（飞书不可用 / 出错）时后端返回 error:true，此时计数不可信 */
  error?: boolean;
  newLeadsCount: number;
  overdueCount: number;
  todayCount: number;
  total: number;
  newLeads?: Array<{ id: string; label: string; site: string }>;
  overdue?: Array<{ leadId: string; label: string }>;
  today?: Array<{ leadId: string; label: string }>;
}

export function NotificationBell() {
  const { data } = useQuery<NotificationData>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000
  });

  const isError = data?.error === true;
  const total = isError ? 0 : (data?.total ?? 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='relative' aria-label='通知' />}
      >
        <Icons.notification className='h-5 w-5' />
        {isError ? (
          <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white'>
            !
          </span>
        ) : total > 0 ? (
          <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold'>
            {total > 99 ? '99+' : total}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72'>
        <DropdownMenuLabel>待处理</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isError ? (
          <div className='px-2 py-6 text-center'>
            <p className='text-sm font-medium text-red-600 dark:text-red-400'>数据源异常</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              暂时无法读取真实待办数（飞书凭证或数据表可能不可用），请检查后台配置。
            </p>
          </div>
        ) : total === 0 ? (
          <div className='text-muted-foreground px-2 py-6 text-center text-sm'>
            都处理完了，喝一杯 ☕
          </div>
        ) : (
          <>
            {(data?.newLeadsCount ?? 0) > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel className='text-muted-foreground text-xs font-normal'>
                  新询盘（24h）
                </DropdownMenuLabel>
                {(data?.newLeads ?? []).map((l) => (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={() => (window.location.href = `/dashboard/leads/${l.id}`)}
                  >
                    <span className='truncate'>{l.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/kanban')}>
                  <span className='text-primary text-xs'>全部新询盘 →</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : null}
            {(data?.overdueCount ?? 0) > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='text-xs font-normal text-red-600 dark:text-red-400'>
                    已逾期 {data?.overdueCount} 条
                  </DropdownMenuLabel>
                  {(data?.overdue ?? []).map((t) => (
                    <DropdownMenuItem
                      key={t.leadId}
                      onClick={() => (window.location.href = `/dashboard/leads/${t.leadId}`)}
                    >
                      <span className='truncate'>{t.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => (window.location.href = '/dashboard/followups')}>
                    <span className='text-primary text-xs'>全部待跟进 →</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
            {(data?.todayCount ?? 0) > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className='text-xs font-normal text-amber-600 dark:text-amber-400'>
                    今日待办 {data?.todayCount} 条
                  </DropdownMenuLabel>
                  {(data?.today ?? []).map((t) => (
                    <DropdownMenuItem
                      key={t.leadId}
                      onClick={() => (window.location.href = `/dashboard/leads/${t.leadId}`)}
                    >
                      <span className='truncate'>{t.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
