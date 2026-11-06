import { queryOptions } from '@tanstack/react-query';
import { fetchOrders } from './service';

export const orderKeys = {
  all: ['orders'] as const,
  list: () => [...orderKeys.all, 'list'] as const
};

export function ordersQueryOptions() {
  return queryOptions({
    queryKey: orderKeys.list(),
    queryFn: fetchOrders
  });
}
