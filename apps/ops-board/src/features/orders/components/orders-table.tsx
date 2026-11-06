'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { Icons } from '@/components/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { SITE_LABELS } from '@/features/kanban/api/types';
import type { Order } from '../api/types';
import { formatMoney, formatOrderDate } from '../utils/format';
import { NewOrderDialog } from './new-order-dialog';
import { OrderDetailDialog } from './order-detail-dialog';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStatusSelect } from './order-status-select';

interface OrdersTableProps {
  orders: Order[];
  source: 'feishu' | 'mock';
}

/** 订单列表：日期 / 客户 / 国家 / 站点 / 件数 / 金额 / 状态 / 操作（查看、改状态）。 */
export function OrdersTable({ orders, source }: OrdersTableProps) {
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const openDetail = (order: Order) => {
    setDetailOrder(order);
    setDetailOpen(true);
  };

  if (orders.length === 0) {
    return (
      <>
        <Empty className='border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Icons.product />
            </EmptyMedia>
            <EmptyTitle>还没有订单</EmptyTitle>
            <EmptyDescription>成交后来这里记一笔，或在询盘详情页点「转为订单」。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)} size='sm'>
              <Icons.add data-icon='inline-start' /> 新建订单
            </Button>
          </EmptyContent>
        </Empty>
        <NewOrderDialog open={createOpen} onOpenChange={setCreateOpen} showTrigger={false} />
      </>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {source === 'mock' && (
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='rounded-sm'>
            演示数据
          </Badge>
          <p className='text-muted-foreground text-xs'>
            未配置 FEISHU_ORDERS_TABLE_ID，当前展示内置样例；新建/改状态保存在本地文件。
          </p>
        </div>
      )}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>国家</TableHead>
              <TableHead>站点</TableHead>
              <TableHead className='text-right'>件数</TableHead>
              <TableHead className='text-right'>金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className='whitespace-nowrap'>
                  {formatOrderDate(order.createdAt)}
                </TableCell>
                <TableCell className='max-w-48 truncate font-medium'>{order.customer}</TableCell>
                <TableCell>{order.country ?? '—'}</TableCell>
                <TableCell>{SITE_LABELS[order.site]}</TableCell>
                <TableCell className='text-right'>{order.totalQty}</TableCell>
                <TableCell className='text-right whitespace-nowrap'>
                  {formatMoney(order.totalAmount, order.currency)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <div className='flex items-center justify-end gap-2'>
                    <Button variant='outline' size='sm' onClick={() => openDetail(order)}>
                      查看
                    </Button>
                    <OrderStatusSelect orderId={order.id} initialStatus={order.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailDialog order={detailOrder} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
