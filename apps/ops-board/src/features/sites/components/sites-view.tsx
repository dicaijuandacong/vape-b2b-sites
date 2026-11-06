'use client';

import { useCallback, useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SiteStatus {
  key: string;
  label: string;
  prodUrl: string;
  github: string;
  gscUrl: string;
  vercelUrl: string;
  domainPending?: string;
  managed: boolean;
  health: { ok: boolean; httpStatus: number | null; latencyMs: number | null };
  env: { key: string; label: string; present: boolean; optional: boolean }[];
  envMissingRequired: number;
  latestCommit: string | null;
}

export function SitesView() {
  const [sites, setSites] = useState<SiteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      if (data.ok) setSites(data.sites);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeploy(siteKey: string) {
    setBusy(siteKey);
    try {
      await fetch('/api/products/deploy', { method: 'POST' }).catch(() => undefined);
    } finally {
      setBusy('');
    }
  }

  return (
    <PageContainer
      pageTitle='站点管理'
      pageDescription='四站线上状态 · env 配置 · 同步 / 重建 · 站外入口'
    >
      {loading ? (
        <p className='py-10 text-center text-sm text-muted-foreground'>检测中…</p>
      ) : (
        <div className='grid gap-4 lg:grid-cols-2'>
          {sites.map((s) => (
            <Card key={s.key}>
              <CardHeader className='flex-row items-center justify-between space-y-0 pb-3'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-lg'>{s.label}</CardTitle>
                  {!s.managed && <Badge variant='outline'>外部站</Badge>}
                </div>
                <Badge variant={s.health.ok ? 'default' : 'destructive'}>
                  {s.health.ok ? `在线 · ${s.health.httpStatus}` : '异常'}
                </Badge>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm'>
                  <a
                    href={s.prodUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary break-all hover:underline'
                  >
                    {s.prodUrl}
                  </a>
                  <div className='mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                    {s.health.latencyMs != null && <span>延迟 {s.health.latencyMs}ms</span>}
                    {s.domainPending && <Badge variant='secondary'>{s.domainPending}</Badge>}
                    {s.latestCommit && <span>最新提交 {s.latestCommit}</span>}
                  </div>
                </div>

                {s.managed && (
                  <div>
                    <div className='mb-1.5 flex items-center justify-between'>
                      <span className='text-xs font-medium text-muted-foreground'>env 配置</span>
                      {s.envMissingRequired > 0 ? (
                        <Badge variant='destructive'>缺 {s.envMissingRequired} 项</Badge>
                      ) : (
                        <Badge variant='outline' className='text-green-600'>
                          已配齐
                        </Badge>
                      )}
                    </div>
                    <div className='flex flex-wrap gap-1.5'>
                      {s.env.map((e) => (
                        <Badge
                          key={e.key}
                          variant={e.present ? 'outline' : 'secondary'}
                          className={`${!e.present && !e.optional ? 'border-amber-500 text-amber-600' : ''} ${e.present ? 'text-green-700' : ''}`}
                          title={e.key}
                        >
                          {e.present ? '✓' : '✗'} {e.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
                  <a
                    href={s.prodUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent'
                  >
                    打开站点
                  </a>
                  {s.github && (
                    <a
                      href={s.github}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent'
                    >
                      GitHub
                    </a>
                  )}
                  <a
                    href={s.gscUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent'
                  >
                    GSC
                  </a>
                  <a
                    href={s.vercelUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent'
                  >
                    Vercel
                  </a>
                  {s.managed && (
                    <Button
                      size='sm'
                      disabled={busy === s.key}
                      onClick={() => void redeploy(s.key)}
                    >
                      {busy === s.key ? '触发中…' : '🚀 重建'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
