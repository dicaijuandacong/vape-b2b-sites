'use client';

import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { OrderStatusBadge } from './order-status-badge';

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid grid-cols-[5rem_1fr] gap-2 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='break-all'>{children}</span>
    </div>
  );
}

/** 「查看」弹窗：订单基础信息 + 商品明细 + 金额/利润。 */
export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>订单详情</DialogTitle>
          <DialogDescription>
            {order ? `${order.customer} · ${SITE_LABELS[order.site]}` : ''}
          </DialogDescription>
        </DialogHeader>
        {order && (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Row label='状态'>
                <OrderStatusBadge status={order.status} />
              </Row>
              <Row label='客户'>{order.customer}</Row>
              <Row label='国家'>{order.country ?? '—'}</Row>
              <Row label='来源站'>{SITE_LABELS[order.site]}</Row>
              <Row label='创建时间'>{formatOrderDate(order.createdAt)}</Row>
              <Row label='付款时间'>{order.paidAt ? formatOrderDate(order.paidAt) : '—'}</Row>
              {order.leadId && (
                <Row label='来源询盘'>
                  <Link
                    href={`/dashboard/leads/${encodeURIComponent(order.leadId)}`}
                    className='text-primary underline underline-offset-4'
                  >
                    查看关联询盘
                  </Link>
                </Row>
              )}
              <Row label='订单 ID'>
                <span className='text-muted-foreground font-mono text-xs'>{order.id}</span>
              </Row>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>型号</TableHead>
                  <TableHead className='text-right'>数量</TableHead>
                  <TableHead className='text-right'>单价</TableHead>
                  <TableHead className='text-right'>小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={`${item.model}-${index}`}>
                    <TableCell className='font-medium'>{item.model}</TableCell>
                    <TableCell className='text-right'>{item.qty}</TableCell>
                    <TableCell className='text-right'>
                      {formatMoney(item.unitPrice, order.currency)}
                    </TableCell>
                    <TableCell className='text-right'>
                      {formatMoney(item.qty * item.unitPrice, order.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className='flex flex-col gap-2 border-t pt-3'>
              <Row label='总件数'>{order.totalQty} 件</Row>
              <Row label='总金额'>
                <span className='font-semibold'>
                  {formatMoney(order.totalAmount, order.currency)}
                </span>
              </Row>
              <Row label='成本'>{typeof order.cost === 'number' ? `¥${order.cost}` : '—'}</Row>
              <Row label='利润'>{typeof order.profit === 'number' ? `¥${order.profit}` : '—'}</Row>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
