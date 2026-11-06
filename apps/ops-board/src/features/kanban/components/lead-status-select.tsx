'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { LEAD_STATUSES, isLeadStatus, type LeadStatus } from '../api/types';
import { updateLeadStatus } from '../api/service';

interface LeadStatusSelectProps {
  leadId: string;
  initialStatus: LeadStatus;
}

const STATUS_ITEMS = LEAD_STATUSES.map((status) => ({ value: status, label: status }));

/** 询盘详情页「状态切换」：选择新状态后 PATCH 到 /api/leads/[id]（飞书 Bitable）。 */
export function LeadStatusSelect({ leadId, initialStatus }: LeadStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(initialStatus);

  const { mutate, isPending } = useMutation({
    mutationFn: (next: LeadStatus) => updateLeadStatus(leadId, next)
  });

  const handleChange = (next: LeadStatus) => {
    if (next === status || isPending) return;
    const prev = status;
    // 乐观更新；失败时回滚到 prev
    setStatus(next);
    mutate(next, {
      onSuccess: () => {
        toast.success(`状态已更新为「${next}」`);
        router.refresh();
      },
      onError: (error) => {
        setStatus(prev);
        toast.error('状态更新失败', {
          description: error instanceof Error ? error.message : undefined
        });
      }
    });
  };

  return (
    <Select
      items={STATUS_ITEMS}
      value={status}
      onValueChange={(value) => {
        if (value !== null && isLeadStatus(value)) handleChange(value);
      }}
      disabled={isPending}
    >
      <SelectTrigger className='w-full'>
        <SelectValue placeholder='选择状态' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {LEAD_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
