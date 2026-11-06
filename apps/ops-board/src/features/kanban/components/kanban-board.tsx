'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DragCancelEvent, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Kanban, KanbanBoard as KanbanBoardPrimitive, KanbanOverlay } from '@/components/ui/kanban';
import { isLeadStatus, type Lead, type LeadStatus } from '../api/types';
import { updateLeadStatus } from '../api/service';
import { useTaskStore, type Task } from '../utils/store';
import { TaskColumn } from './board-column';
import { TaskCard } from './task-card';
import { createRestrictToContainer } from '../utils/restrict-to-container';

function findTaskColumn(columns: Record<string, Task[]>, taskId: string): string | null {
  for (const [column, tasks] of Object.entries(columns)) {
    if (tasks.some((task) => task.id === taskId)) return column;
  }
  return null;
}

interface KanbanBoardProps {
  initialLeads: Lead[];
  source: 'feishu' | 'mock';
}

export function KanbanBoard({ initialLeads, source }: KanbanBoardProps) {
  const { columns, setColumns, loadLeads, moveTaskToColumn } = useTaskStore();
  const containerRef = useRef<HTMLDivElement>(null);
  /** 拖拽起点信息：用于拖拽结束时判断列是否变化 / 失败回滚 */
  const dragOriginRef = useRef<{ id: string; from: string } | null>(null);

  // 服务端传入的询盘 → 按状态分列灌入看板
  useEffect(() => {
    loadLeads(initialLeads);
  }, [initialLeads, loadLeads]);

  const { mutate: persistStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus; from: string }) =>
      updateLeadStatus(id, status),
    onError: (error, variables) => {
      // 持久化失败 → 卡片退回原列
      moveTaskToColumn(variables.id, variables.from);
      toast.error('状态更新失败，已还原', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps -- factory function, stable after mount
  const restrictToBoard = useCallback(
    createRestrictToContainer(() => containerRef.current),
    []
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id);
    const currentColumns = useTaskStore.getState().columns;
    if (id in currentColumns) return; // 列拖拽（理论上不会发生，列已禁拖）
    const from = findTaskColumn(currentColumns, id);
    dragOriginRef.current = from ? { id, from } : null;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const origin = dragOriginRef.current;
      dragOriginRef.current = null;
      if (!origin) return;

      if (!event.over) {
        // 拖到空白区域松手：退回原列
        moveTaskToColumn(origin.id, origin.from);
        return;
      }

      const currentColumns = useTaskStore.getState().columns;
      const to = findTaskColumn(currentColumns, origin.id);
      if (!to || to === origin.from || !isLeadStatus(to)) return;

      // 列已变化（onDragOver 期间已乐观移动）→ 持久化到飞书
      persistStatus({ id: origin.id, status: to, from: origin.from });
    },
    [moveTaskToColumn, persistStatus]
  );

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      const origin = dragOriginRef.current;
      dragOriginRef.current = null;
      if (origin) moveTaskToColumn(origin.id, origin.from);
    },
    [moveTaskToColumn]
  );

  return (
    <div ref={containerRef} className='flex flex-col gap-3'>
      {source === 'mock' && (
        <p className='text-muted-foreground text-xs'>
          当前为演示数据（未配置飞书环境变量或连接失败），拖拽不会保存。配置 FEISHU_APP_ID /
          FEISHU_APP_SECRET / FEISHU_BITABLE_APP_TOKEN / FEISHU_LEADS_TABLE_ID
          后自动切换为实时数据。
        </p>
      )}
      <Kanban
        value={columns}
        onValueChange={setColumns}
        getItemValue={(item) => item.id}
        modifiers={[restrictToBoard]}
        autoScroll={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className='w-full overflow-x-auto rounded-md pb-4'>
          <KanbanBoardPrimitive className='flex flex-col items-start gap-4 md:flex-row'>
            {Object.entries(columns).map(([columnValue, tasks]) => (
              <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />
            ))}
          </KanbanBoardPrimitive>
        </div>
        <KanbanOverlay>
          {({ value, variant }) => {
            if (variant === 'column') {
              const tasks = columns[value] ?? [];
              return <TaskColumn value={value} tasks={tasks} />;
            }

            const task = Object.values(columns)
              .flat()
              .find((task) => task.id === value);

            if (!task) return null;
            return <TaskCard task={task} />;
          }}
        </KanbanOverlay>
      </Kanban>
    </div>
  );
}
