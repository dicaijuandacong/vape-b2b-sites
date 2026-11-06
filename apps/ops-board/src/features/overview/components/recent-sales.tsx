import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { SITE_LABELS, type Lead, type LeadStatus } from '@/features/kanban/api/types';
import { formatRelativeTime } from '../lib/lead-chart-data';

const STATUS_BADGE_VARIANTS: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  新询盘: 'secondary',
  已联系: 'outline',
  已报价: 'outline',
  样品单: 'outline',
  成交: 'default',
  流失: 'destructive',
  待跟进: 'secondary'
};

function initialsOf(lead: Lead): string {
  const base = (lead.company ?? lead.email).trim();
  return base.slice(0, 2).toUpperCase();
}

interface RecentSalesProps {
  leads?: Lead[];
  source?: 'feishu' | 'mock';
}

export function RecentSales({ leads = [], source = 'mock' }: RecentSalesProps) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>最新询盘</CardTitle>
        <CardDescription>
          最近 {leads.length} 条 · {source === 'feishu' ? '飞书实时' : '本地 mock'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className='text-muted-foreground flex min-h-[200px] items-center justify-center text-sm'>
            暂无询盘
          </div>
        ) : (
          <div className='space-y-8'>
            {leads.map((lead) => (
              <div key={lead.id} className='flex items-center'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback>{initialsOf(lead)}</AvatarFallback>
                </Avatar>
                <div className='ml-4 min-w-0 flex-1 space-y-1'>
                  <p className='truncate text-sm leading-none font-medium'>
                    {lead.company ?? lead.email}
                  </p>
                  <p className='text-muted-foreground truncate text-sm'>
                    {lead.company ? lead.email : (lead.country ?? '')}
                  </p>
                </div>
                <div className='ml-auto flex shrink-0 flex-col items-end gap-1'>
                  <Badge variant={STATUS_BADGE_VARIANTS[lead.status]}>{lead.status}</Badge>
                  <span className='text-muted-foreground text-xs whitespace-nowrap'>
                    {SITE_LABELS[lead.site]} · {formatRelativeTime(lead.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
