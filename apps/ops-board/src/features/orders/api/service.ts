import { apiClient } from '@/lib/api-client';
import type { CreateOrderInput, OrdersResponse, OrderStatus } from './types';

/**
 * 订单客户端数据访问 —— 走 /api/orders 路由（BFF 模式）。
 * 服务端直接读库请用 '@/lib/orders' 的 getOrders()。
 */

export function fetchOrders(): Promise<OrdersResponse> {
  return apiClient<OrdersResponse>('/orders');
}

export async function createOrder(input: CreateOrderInput): Promise<{ id: string }> {
  return apiClient<{ id: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateOrderStatus(recordId: string, status: OrderStatus): Promise<void> {
  await apiClient(`/orders/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}
