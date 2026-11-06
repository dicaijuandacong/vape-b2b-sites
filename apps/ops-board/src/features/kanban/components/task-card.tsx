'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { KanbanItem } from '@/components/ui/kanban';
import { SITE_LABELS, LEAD_TYPE_LABELS } from '../api/types';
import type { Task } from '../utils/store';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: Task;
}

const SITE_BADGE_VARIANTS = {
  dubai: 'default',
  gulf: 'secondary',
  europe: 'outline',
  vapegogogo: 'secondary'
} as const;

/**
 * 卡片标题即详情页链接。整卡是 dnd-kit 拖拽 handle，链接必须 stopPropagation
 * 掉 activator 事件（mouse/touch/key/pointer down），否则按下链接也会触发拖拽；
 * prefetch={false} 避免卡片进入视口时预取所有详情页（每次都会打一次飞书接口）。
 */
const LINK_GUARD_PROPS = {
  draggable: false,
  prefetch: false,
  onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation()
} as const;

export function TaskCard({ task, ...props }: TaskCardProps) {
  return (
    <KanbanItem
      key={task.id}
      value={task.id}
      {...props}
      render={<div className='bg-card rounded-md border p-3 shadow-xs' />}
    >
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between gap-2'>
          <Link
            href={`/dashboard/leads/${task.id}`}
            {...LINK_GUARD_PROPS}
            className='hover:text-primary line-clamp-1 text-sm font-medium hover:underline'
          >
            {task.title}
          </Link>
          <Badge
            variant={SITE_BADGE_VARIANTS[task.site]}
            className='pointer-events-none h-5 shrink-0 rounded-sm px-1.5 text-[11px]'
          >
            {SITE_LABELS[task.site]}
          </Badge>
        </div>
        <div className='text-muted-foreground line-clamp-1 text-xs'>{task.email}</div>
        <div className='text-muted-foreground flex items-center justify-between gap-2 text-xs'>
          <span className='line-clamp-1'>
            {LEAD_TYPE_LABELS[task.type]}
            {task.country ? ` · ${task.country}` : ''}
          </span>
          {task.volume && <span className='shrink-0 text-[11px] tabular-nums'>{task.volume}</span>}
        </div>
      </div>
    </KanbanItem>
  );
}
