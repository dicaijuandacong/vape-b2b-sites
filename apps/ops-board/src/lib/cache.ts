/**
 * 飞书 Bitable 读取缓存 —— 解决 Vercel 每次页面加载都要从飞书拉全量数据的性能问题。
 *
 * 缓存介质：ops_kv 表（KV key 前缀 cache_，64 字符内）+ 进程内存（TTL 内命中直接返回）。
 * 失效：TTL（默认 30 分钟）到期自然过期；/api/cache/refresh 手动失效。
 * 回退：缓存读失败静默降级到直连飞书，永远不出错。
 *
 * 用法：const data = await cachedQuery('leads_all', () => fetchAllLeadRecords());
 */
import { kvGet, kvSet } from './bitable-kv';

export interface CacheEnvelope<T> {
  v: 1;
  cachedAt: number; // epoch ms
  ttlMs: number;
  data: T;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const KEY_RE = /^[a-z0-9_]{1,50}$/; // cache_ 前缀后总长 ≤64，符合 ops_kv SAFE_KEY_RE

// 进程级内存缓存：同 serverless 实例内 TTL 内 0 网络调用
const memory = new Map<string, { data: unknown; expiresAt: number }>();

function memKey(key: string): string {
  return `cache_${key}`;
}

export async function cachedQuery<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  if (!KEY_RE.test(key)) {
    throw new Error(`cache key invalid: ${key}`);
  }
  const now = Date.now();

  // L1 内存
  const m = memory.get(memKey(key));
  if (m && m.expiresAt > now) return m.data as T;

  // L2 ops_kv（跨实例共享）
  try {
    const env = await kvGet<CacheEnvelope<T>>(memKey(key));
    if (env && env.v === 1 && typeof env.cachedAt === 'number' && env.cachedAt + env.ttlMs > now) {
      memory.set(memKey(key), { data: env.data, expiresAt: env.cachedAt + env.ttlMs });
      return env.data;
    }
  } catch {
    /* L2 读失败继续走源 */
  }

  // L3 源
  const data = await loader();
  memory.set(memKey(key), { data, expiresAt: now + ttlMs });
  try {
    await kvSet(memKey(key), { v: 1, cachedAt: now, ttlMs, data } satisfies CacheEnvelope<T>);
  } catch {
    /* 缓存写失败不影响响应 */
  }
  return data;
}

/** 手动失效指定 key（增量；全站刷新用 /api/cache/refresh）。 */
export async function invalidateCache(key: string): Promise<void> {
  memory.delete(memKey(key));
  try {
    // 用 cachedAt=0 让下次读必过期（比删行更幂等）
    await kvSet(memKey(key), { v: 1, cachedAt: 0, ttlMs: 1, data: null });
  } catch {
    /* 忽略 */
  }
}

/** 数据写入后调用：失效相关缓存，失败静默（下次 TTL 自然过期兜底）。 */
export async function invalidateCaches(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => invalidateCache(k)));
}

/** 全清内存（不清 L2，仅本实例热态清 —— 用于刷新接口的快速路径）。 */
export function invalidateCacheMemory(keys: string[]): void {
  for (const k of keys) memory.delete(memKey(k));
}

/** 缓存 key 清单（/api/cache/refresh 逐键失效）。 */
export const CACHE_KEYS = [
  'leads_all',
  'followups_all',
  'orders_all',
  'prospects_all',
  'followup_tasks',
  'overview_kpis'
] as const;
