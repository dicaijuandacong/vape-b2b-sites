import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { toWhatsAppUrl } from '@/lib/feishu-base';
import { getProspects, PROSPECT_STATUSES } from '@/lib/prospects';
import { ProspectStatusSelect } from '@/features/prospects/components/prospect-status-select';
import { BatchCaller } from '@/features/prospects/components/batch-caller';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Dashboard : 潜在客户'
};

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 300;

const WA_INTRO = encodeURIComponent(
  'Hi! We are a vape wholesale supplier (Europe-compliant TPD stock, Dubai & KSA lines). Mind if I send you our latest price list?'
);

type Search = Promise<{ country?: string; status?: string; q?: string; priority?: string }>;

const PRIORITY_BADGE: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  S: 'destructive',
  A: 'secondary',
  B: 'outline',
  C: 'outline'
};

export default async function Page({ searchParams }: { searchParams: Search }) {
  const { country = '', status = '', q = '', priority = '' } = await searchParams;
  const { prospects, source } = await getProspects();

  const keyword = q.trim().toLowerCase();
  const filtered = prospects.filter((p) => {
    if (country && p.country !== country) return false;
    if (status && p.status !== status) return false;
    if (priority && p.priority !== priority) return false;
    if (
      keyword &&
      !p.name.toLowerCase().includes(keyword) &&
      !p.city.toLowerCase().includes(keyword) &&
      !p.address.toLowerCase().includes(keyword)
    ) {
      return false;
    }
    return true;
  });

  const withPhone = filtered.filter((p) => p.phone).length;
  const byCountry = new Map<string, number>();
  for (const p of prospects) {
    if (p.country) byCountry.set(p.country, (byCountry.get(p.country) ?? 0) + 1);
  }
  const topCountries = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const shown = filtered.slice(0, PAGE_SIZE);

  function filterHref(next: { country?: string; status?: string; priority?: string }) {
    const params = new URLSearchParams();
    const c = next.country ?? country;
    const s = next.status ?? status;
    const pr = next.priority ?? priority;
    if (c) params.set('country', c);
    if (s) params.set('status', s);
    if (pr) params.set('priority', pr);
    if (q) params.set('q', q);
    const qs = params.toString();
    return qs ? `/dashboard/prospects?${qs}` : '/dashboard/prospects';
  }

  return (
    <PageContainer
      pageTitle='潜在客户（外呼清单）'
      pageDescription={
        filtered.length > 0
          ? `${filtered.length} 家门店${source === 'mock' ? '（演示数据，抓取跑完后自动变真实数据）' : ''} · ${withPhone} 家有电话（${Math.round((withPhone * 100) / Math.max(filtered.length, 1))}%）· 来源：Google Maps 全欧抓取`
          : '还没有潜在客户数据 —— Google Maps 抓取跑完后自动出现'
      }
    >
      <BatchCaller prospects={prospects} countryFilter={country || undefined} />

      <div className='flex flex-wrap items-center gap-1.5'>
        <Link
          href={filterHref({ country: '' })}
          className={cn(
            buttonVariants({ variant: country ? 'outline' : 'secondary', size: 'sm' }),
            'h-7 rounded-sm px-2 text-xs'
          )}
        >
          全部 {prospects.length}
        </Link>
        {topCountries.map(([c, n]) => (
          <Link
            key={c}
            href={filterHref({ country: c })}
            className={cn(
              buttonVariants({ variant: country === c ? 'secondary' : 'outline', size: 'sm' }),
              'h-7 rounded-sm px-2 text-xs'
            )}
          >
            {c} {n}
          </Link>
        ))}
        <span className='bg-border mx-1 h-4 w-px' />
        {['S', 'A', 'B', 'C'].map((pr) => (
          <Link
            key={pr}
            href={filterHref({ priority: priority === pr ? '' : pr })}
            className={cn(
              buttonVariants({ variant: priority === pr ? 'secondary' : 'outline', size: 'sm' }),
              'h-7 rounded-sm px-2 text-xs font-semibold'
            )}
          >
            {pr} 级 {prospects.filter((p) => p.priority === pr).length}
          </Link>
        ))}
        <span className='bg-border mx-1 h-4 w-px' />
        {(status ? PROSPECT_STATUSES : PROSPECT_STATUSES.slice(0, 3)).map((s) => (
          <Link
            key={s}
            href={filterHref({ status: status === s ? '' : s })}
            className={cn(
              buttonVariants({ variant: status === s ? 'secondary' : 'outline', size: 'sm' }),
              'h-7 rounded-sm px-2 text-xs'
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className='p-0'>
          {shown.length === 0 ? (
            <div className='text-muted-foreground flex flex-col items-center gap-2 py-16 text-sm'>
              <Icons.search className='h-8 w-8' />
              没有匹配的门店 —— 换个国家 / 状态筛选，或等抓取任务跑完
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>优先</TableHead>
                  <TableHead>门店</TableHead>
                  <TableHead>国家</TableHead>
                  <TableHead>城市</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>痛点</TableHead>
                  <TableHead>开场白（点电话自带）</TableHead>
                  <TableHead>外呼状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((p) => {
                  // 点电话跳 WhatsApp 时带上这家店专属开场白（差评痛点版优先）
                  const wa = p.phone ? toWhatsAppUrl(p.phone, p.opener || WA_INTRO) : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.priority ? (
                          <Badge
                            variant={PRIORITY_BADGE[p.priority] ?? 'outline'}
                            className='rounded-sm font-semibold'
                          >
                            {p.priority}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{p.name}</span>
                          {p.website ? (
                            <a
                              href={p.website}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-muted-foreground inline-flex items-center gap-0.5 text-xs hover:underline'
                            >
                              网站 <Icons.externalLink className='h-3 w-3' />
                            </a>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className='rounded-sm'>
                          {p.country || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>{p.city || '—'}</TableCell>
                      <TableCell className='max-w-[280px] truncate' title={p.address}>
                        {p.address || '—'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap'>
                        {wa ? (
                          <a
                            href={wa}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 text-xs text-green-700 hover:underline dark:text-green-400'
                          >
                            <Icons.chat className='h-3.5 w-3.5' />
                            {p.phone}
                          </a>
                        ) : (
                          <span className='text-muted-foreground text-xs'>无电话</span>
                        )}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-xs'>
                        {p.rating != null
                          ? `★ ${p.rating}${p.reviews != null ? ` (${p.reviews})` : ''}`
                          : '—'}
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-xs'>
                        {p.pain ? (
                          <Badge
                            variant='outline'
                            className='rounded-sm text-red-600 dark:text-red-400'
                          >
                            {p.pain}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell
                        className='max-w-[320px] truncate text-xs text-muted-foreground'
                        title={p.opener}
                      >
                        {p.opener || '—'}
                      </TableCell>
                      <TableCell>
                        <ProspectStatusSelect prospectId={p.id} initialStatus={p.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {filtered.length > PAGE_SIZE ? (
        <p className='text-muted-foreground text-xs'>
          仅显示前 {PAGE_SIZE} 条（共 {filtered.length} 条）—— 加筛选条件缩小范围，完整数据在飞书
          Bitable「prospects」表
        </p>
      ) : null}
    </PageContainer>
  );
}
