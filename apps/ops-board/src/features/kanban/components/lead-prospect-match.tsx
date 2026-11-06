'use client';

/**
 * 询盘 ↔ Maps 潜在客户匹配提示：根据 company/name 归一化模糊匹配，
 * 命中就提示「这可能是外呼清单里的某家店」并给直达链接。
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { Prospect } from '@/lib/prospects';
import type { Lead } from '../api/types';

const SUFFIX_RE =
  /\b(llc|ltd|gmbh|sarl|sa|bv|b\.v\.|s\.l\.|s\.r\.l\.|srl|spa|s\.p\.a\.|oy|ab|as|aps|oyj|kft|sp\. z o\.o\.|sp z oo|doo|sro|s\.r\.o\.|inc|corp|co|company|store|shop)\b\.?/gi;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(SUFFIX_RE, '')
    .replace(/[^a-z0-9一-龥]+/g, '')
    .trim();
}

export function LeadProspectMatch({ lead, prospects }: { lead: Lead; prospects: Prospect[] }) {
  const matches = useMemo(() => {
    if (!lead.company) return [];
    const q = normalize(lead.company);
    if (q.length < 3) return [];
    const out: Array<{ p: Prospect; score: number }> = [];
    for (const p of prospects) {
      const t = normalize(p.name);
      if (t.length < 3) continue;
      let score = 0;
      if (t === q) score = 100;
      else if (t.includes(q) || q.includes(t)) score = Math.min(t.length, q.length) >= 6 ? 80 : 50;
      if (score >= 50) out.push({ p, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [lead.company, prospects]);

  if (matches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Icons.search className='h-4 w-4' />
          疑似来自外呼清单
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        {matches.map(({ p, score }) => (
          <div key={p.id} className='flex flex-col gap-1 rounded-lg border border-border p-3'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-sm font-medium'>{p.name}</span>
              <Badge variant={score >= 80 ? 'default' : 'secondary'} className='rounded-sm'>
                {score >= 80 ? '高度匹配' : '可能匹配'}
              </Badge>
            </div>
            <div className='text-muted-foreground text-xs'>
              {p.city} · {p.country}
              {p.rating != null ? ` · ★${p.rating}` : ''}
            </div>
            <Link
              href={`/dashboard/prospects?q=${encodeURIComponent(p.name)}`}
              className='text-primary text-xs hover:underline'
            >
              去外呼清单看详情 →
            </Link>
          </div>
        ))}
        <p className='text-muted-foreground text-xs'>
          如果这就是同一家店，跟进时可以直接看它的 Google 评分/评论/社媒，话术更有针对性。
        </p>
      </CardContent>
    </Card>
  );
}
