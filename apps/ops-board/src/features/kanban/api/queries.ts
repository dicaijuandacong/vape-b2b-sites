import { queryOptions } from '@tanstack/react-query';
import { fetchLeads } from './service';

export const leadKeys = {
  all: ['leads'] as const,
  list: () => [...leadKeys.all, 'list'] as const
};

export function leadsQueryOptions() {
  return queryOptions({
    queryKey: leadKeys.list(),
    queryFn: fetchLeads
  });
}
