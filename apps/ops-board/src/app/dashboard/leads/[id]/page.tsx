import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getLeads } from '@/lib/leads';
import { getProspects } from '@/lib/prospects';
import { getOrders } from '@/lib/orders';
import { getLeadFollowupSchedule } from '@/lib/calendar';
import { getFollowups } from '@/lib/followups';
import { cn } from '@/lib/utils';
import { LEAD_TYPE_LABELS, SITE_LABELS, type LeadSite } from '@/features/kanban/api/types';
import { FollowupCalendarSync } from '@/features/kanban/components/followup-calendar-sync';
import { FollowupTimeline } from '@/features/kanban/components/followup-timeline';
import { LeadContactActions } from '@/features/kanban/components/lead-contact-actions';
import { LeadEditDialog } from '@/features/kanban/components/lead-edit-dialog';
import { LeadFollowupForm } from '@/features/kanban/components/lead-followup-form';
import { LeadProspectMatch } from '@/features/kanban/components/lead-prospect-match';
import { LeadStatusSelect } from '@/features/kanban/components/lead-status-select';

export const metadata = {
  title: 'Dashboard : 询盘详情'
};

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

const SITE_BADGE_VARIANTS: Record<LeadSite, 'default' | 'secondary' | 'outline'> = {
  dubai: 'default',
  gulf: 'secondary',
  europe: 'outline',
  vapegogogo: 'secondary'
};

/** 询盘时间统一按上海时区展示（运营团队在国内）。 */
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1 sm:grid sm:grid-cols-[6rem_1fr] sm:gap-4'>
      <dt className='text-muted-foreground shrink-0 text-sm'>{label}</dt>
      <dd className='text-sm break-all'>{children}</dd>
    </div>
  );
}

const EMPTY = <span className='text-muted-foreground'>—</span>;

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [{ leads }, schedule, followups, { prospects }, { orders }] = await Promise.all([
    getLeads(),
    getLeadFollowupSchedule(id),
    getFollowups(id),
    getProspects(),
    getOrders()
  ]);
  const lead = leads.find((item) => item.id === id);
  if (!lead) notFound();
  const relatedOrders = orders.filter((o) => o.leadId === id);

  return (
    <PageContainer
      pageTitle={lead.company ?? lead.email}
      pageDescription={`${LEAD_TYPE_LABELS[lead.type]} · ${SITE_LABELS[lead.site]} · ${lead.email}`}
      pageHeaderAction={
        <Link
          href='/dashboard/kanban'
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs md:text-sm')}
        >
          <Icons.chevronLeft className='mr-2 h-4 w-4' /> 返回看板
        </Link>
      }
    >
      <div className='grid flex-1 items-start gap-4 lg:grid-cols-[1fr_20rem]'>
        <div className='flex flex-col gap-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle>询盘信息</CardTitle>
                <LeadEditDialog lead={lead} />
              </div>
            </CardHeader>
            <CardContent>
              <dl className='flex flex-col gap-4'>
                <DetailItem label='来源站点'>
                  <Badge variant={SITE_BADGE_VARIANTS[lead.site]} className='rounded-sm'>
                    {SITE_LABELS[lead.site]}
                  </Badge>
                </DetailItem>
                <DetailItem label='类型'>{LEAD_TYPE_LABELS[lead.type]}</DetailItem>
                <DetailItem label='邮箱'>{lead.email}</DetailItem>
                <DetailItem label='电话'>{lead.phone ?? EMPTY}</DetailItem>
                <DetailItem label='国家'>{lead.country ?? EMPTY}</DetailItem>
                <DetailItem label='意向品牌'>
                  {lead.brands?.length ? (
                    <span className='flex flex-wrap gap-1.5'>
                      {lead.brands.map((brand) => (
                        <Badge key={brand} variant='secondary' className='rounded-sm'>
                          {brand}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    EMPTY
                  )}
                </DetailItem>
                <DetailItem label='采购量级'>{lead.volume ?? EMPTY}</DetailItem>
                <DetailItem label='备注'>
                  {lead.notes ? <span className='whitespace-pre-wrap'>{lead.notes}</span> : EMPTY}
                </DetailItem>
                <DetailItem label='创建时间'>{formatCreatedAt(lead.createdAt)}</DetailItem>
                <DetailItem label='询盘 ID'>
                  <span className='text-muted-foreground font-mono text-xs'>{lead.id}</span>
                </DetailItem>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>跟进记录</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-6'>
              <FollowupTimeline followups={followups} />
              <Separator />
              <LeadFollowupForm leadId={lead.id} />
            </CardContent>
          </Card>

          {relatedOrders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>该客户订单（{relatedOrders.length}）</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-2'>
                {relatedOrders.map((o) => (
                  <div
                    key={o.id}
                    className='flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm'
                  >
                    <span className='text-muted-foreground'>{o.customer || '—'}</span>
                    <span className='font-medium tabular-nums'>
                      {o.totalAmount != null
                        ? `${o.currency ?? ''} ${o.totalAmount.toLocaleString()}`
                        : '—'}
                    </span>
                    <Link href='/dashboard/orders' className='text-primary text-xs hover:underline'>
                      订单页 →
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className='flex flex-col gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>状态切换</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusSelect leadId={lead.id} initialStatus={lead.status} />
            </CardContent>
          </Card>

          <LeadProspectMatch lead={lead} prospects={prospects} />

          <Card>
            <CardHeader>
              <CardTitle>一键触达</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadContactActions lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>转为订单</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-col gap-2'>
              <p className='text-muted-foreground text-sm'>
                成交后跳到订单页，自动按此询盘预填客户与站点。
              </p>
              <Link
                href={`/dashboard/orders?create=1&fromLead=${encodeURIComponent(lead.id)}`}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                <Icons.orders className='mr-2 h-4 w-4' /> 转为订单
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日历提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <FollowupCalendarSync
                leadId={lead.id}
                leadLabel={lead.company ?? lead.email}
                initialNextFollowAt={schedule.nextFollowAt}
                initialEventId={schedule.calendarEventId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
