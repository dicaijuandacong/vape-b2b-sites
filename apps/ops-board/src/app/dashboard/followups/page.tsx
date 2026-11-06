import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import {
  FOLLOW_CHANNEL_LABELS,
  FOLLOWUP_STALE_DAYS,
  getFollowupTasks,
  getTaskUrgency,
  type TaskUrgency
} from '@/lib/followups';
import { SITE_LABELS } from '@/features/kanban/api/types';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard : 待跟进任务'
};

export const dynamic = 'force-dynamic';

const URGENCY_META: Record<
  TaskUrgency,
  {
    label: string;
    badge: 'destructive' | 'secondary' | 'outline';
    rowClass?: string;
  }
> = {
  overdue: {
    label: '已逾期',
    badge: 'destructive',
    rowClass: 'bg-red-50/60 dark:bg-red-950/20'
  },
  today: {
    label: '今日待办',
    badge: 'secondary',
    rowClass: 'bg-amber-50/60 dark:bg-amber-950/20'
  },
  upcoming: {
    label: '未来跟进',
    badge: 'outline'
  }
};

/** 应跟进日期按上海时区展示。 */
function formatDueAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}

export default async function Page() {
  const { tasks, source } = await getFollowupTasks();

  const counts: Record<TaskUrgency, number> = {
    overdue: 0,
    today: 0,
    upcoming: 0
  };
  for (const task of tasks) counts[getTaskUrgency(task.dueAt)] += 1;

  const summary = [
    counts.overdue > 0 ? `${counts.overdue} 条已逾期` : null,
    counts.today > 0 ? `${counts.today} 条今日待办` : null,
    counts.upcoming > 0 ? `${counts.upcoming} 条未来跟进` : null
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PageContainer
      pageTitle='待跟进任务'
      pageDescription={
        tasks.length > 0
          ? `${summary}${source === 'mock' ? '（演示数据）' : ''}；僵住规则：新询盘 / 已联系 / 待跟进超过 ${FOLLOWUP_STALE_DAYS} 天未触达`
          : '暂无待跟进任务，所有询盘都在正常节奏里'
      }
    >
      <Card>
        <CardContent className='p-0'>
          {tasks.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-16 text-sm'>
              <Icons.circleCheck className='h-8 w-8' />
              今日无待办，去「询盘漏斗」看看有没有新询盘吧
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>应跟进日期</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>国家</TableHead>
                  <TableHead>来源站</TableHead>
                  <TableHead>跟进事由</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className='text-right'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const urgency = getTaskUrgency(task.dueAt);
                  const meta = URGENCY_META[urgency];
                  return (
                    <TableRow key={`${task.leadId}-${task.dueAt}`} className={cn(meta.rowClass)}>
                      <TableCell className='font-medium whitespace-nowrap'>
                        {formatDueAt(task.dueAt)}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{task.company ?? task.email}</span>
                          {task.company && (
                            <span className='text-muted-foreground text-xs'>{task.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{task.country ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className='rounded-sm'>
                          {SITE_LABELS[task.site]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <span className='text-sm'>{task.reason}</span>
                          {task.lastChannel && (
                            <Badge variant='secondary' className='rounded-sm'>
                              上次：{FOLLOW_CHANNEL_LABELS[task.lastChannel]}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={meta.badge} className='rounded-sm'>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Link
                          href={`/dashboard/leads/${task.leadId}`}
                          className={cn(
                            buttonVariants({ variant: 'outline', size: 'sm' }),
                            'text-xs'
                          )}
                        >
                          去跟进 <Icons.arrowRight className='ml-1 h-3.5 w-3.5' />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
