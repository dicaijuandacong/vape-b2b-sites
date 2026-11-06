import { NextResponse } from 'next/server';
import { invalidateCaches, CACHE_KEYS } from '@/lib/cache';
import { recordAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/** 手动失效全量读取缓存（leads/followups/orders/prospects）。写操作本身已自动失效，这里是兜底。 */
export async function POST() {
  try {
    await invalidateCaches([...CACHE_KEYS]);
    await recordAudit('cache.refresh', '-', `手动刷新缓存 (${CACHE_KEYS.length} keys)`);
    return NextResponse.json({ ok: true, keys: CACHE_KEYS });
  } catch (e) {
    console.error('[api/cache/refresh] failed:', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'refresh failed' }, { status: 502 });
  }
}
