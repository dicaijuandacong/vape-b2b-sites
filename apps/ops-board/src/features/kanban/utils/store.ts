import { create } from 'zustand';
import { LEAD_STATUSES, type Lead, type LeadSite, type LeadType } from '../api/types';

/** 看板卡片承载的询盘字段。id 即飞书 record_id。 */
export type Task = {
  id: string;
  /** 展示标题：公司名，无公司则邮箱 */
  title: string;
  email: string;
  site: LeadSite;
  type: LeadType;
  country?: string;
  volume?: string;
};

type KanbanState = {
  /** key 为漏斗状态（中文），与 LEAD_STATUSES 一一对应 */
  columns: Record<string, Task[]>;
  setColumns: (columns: Record<string, Task[]>) => void;
  /** 用最新询盘列表整体重建各列 */
  loadLeads: (leads: Lead[]) => void;
  /** 把一张卡片移动回指定列（用于持久化失败后的回滚） */
  moveTaskToColumn: (taskId: string, column: string) => void;
};

function emptyColumns(): Record<string, Task[]> {
  return Object.fromEntries(LEAD_STATUSES.map((status) => [status, []]));
}

export function leadToTask(lead: Lead): Task {
  return {
    id: lead.id,
    title: lead.company ?? lead.email,
    email: lead.email,
    site: lead.site,
    type: lead.type,
    country: lead.country,
    volume: lead.volume
  };
}

function groupLeads(leads: Lead[]): Record<string, Task[]> {
  const columns = emptyColumns();
  for (const lead of leads) {
    const bucket = columns[lead.status] ?? columns[LEAD_STATUSES[0]];
    bucket.push(leadToTask(lead));
  }
  return columns;
}

export const useTaskStore = create<KanbanState>()((set) => ({
  columns: emptyColumns(),

  setColumns: (columns) => set({ columns }),

  loadLeads: (leads) => set({ columns: groupLeads(leads) }),

  moveTaskToColumn: (taskId, column) =>
    set((state) => {
      let task: Task | undefined;
      const next: Record<string, Task[]> = {};
      for (const [key, tasks] of Object.entries(state.columns)) {
        const found = tasks.find((t) => t.id === taskId);
        if (found) {
          task = found;
          next[key] = tasks.filter((t) => t.id !== taskId);
        } else {
          next[key] = tasks;
        }
      }
      if (!task) return {};
      next[column] = [...(next[column] ?? []), task];
      return { columns: next };
    })
}));
