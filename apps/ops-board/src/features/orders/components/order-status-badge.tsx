import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '../api/types';

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  意向: 'outline',
  已付款: 'secondary',
  已发货: 'default',
  已完成: 'default',
  已取消: 'destructive'
};

/** 订单状态徽章（表格 / 详情共用）。 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className='rounded-sm'>
      {status}
    </Badge>
  );
}
