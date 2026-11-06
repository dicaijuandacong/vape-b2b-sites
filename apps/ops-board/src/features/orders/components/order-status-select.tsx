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
import { ORDER_STATUSES, isOrderStatus, type OrderStatus } from '../api/types';
import { updateOrderStatus } from '../api/service';

interface OrderStatusSelectProps {
  orderId: string;
  initialStatus: OrderStatus;
}

const STATUS_ITEMS = ORDER_STATUSES.map((status) => ({ value: status, label: status }));

/** 订单表格「改状态」：选择新状态后 PATCH 到 /api/orders/[id]（飞书 Bitable）。 */
export function OrderStatusSelect({ orderId, initialStatus }: OrderStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(initialStatus);

  const { mutate, isPending } = useMutation({
    mutationFn: (next: OrderStatus) => updateOrderStatus(orderId, next)
  });

  const handleChange = (next: OrderStatus) => {
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
        if (value !== null && isOrderStatus(value)) handleChange(value);
      }}
      disabled={isPending}
    >
      <SelectTrigger className='w-28' size='sm'>
        <SelectValue placeholder='改状态' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ORDER_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
