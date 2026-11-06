'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { leadsQueryOptions } from '../api/queries';
import { useTaskStore } from '../utils/store';

export function RefreshLeadsButton() {
  const queryClient = useQueryClient();
  const loadLeads = useTaskStore((state) => state.loadLeads);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await queryClient.fetchQuery(leadsQueryOptions());
      loadLeads(data.leads);
      toast.success(`已刷新 ${data.leads.length} 条询盘`, {
        description: data.source === 'feishu' ? '数据来源：飞书 Bitable' : '数据来源：演示数据'
      });
    } catch {
      toast.error('刷新失败，请稍后再试');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button variant='secondary' size='sm' onClick={handleRefresh} disabled={isRefreshing}>
      <Icons.spinner className={isRefreshing ? 'animate-spin' : 'hidden'} aria-hidden />
      刷新
    </Button>
  );
}
