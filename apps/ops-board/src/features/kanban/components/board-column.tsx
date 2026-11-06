'use client';

import { Badge } from '@/components/ui/badge';
import { KanbanColumn } from '@/components/ui/kanban';
import type { Task } from '../utils/store';
import { TaskCard } from './task-card';

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
  tasks: Task[];
}

export function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  return (
    <KanbanColumn value={value} className='w-full shrink-0 md:w-80' {...props}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold'>{value}</span>
          <Badge variant='secondary' className='pointer-events-none rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className='flex flex-col gap-2 p-0.5'>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle />
        ))}
      </div>
    </KanbanColumn>
  );
}
