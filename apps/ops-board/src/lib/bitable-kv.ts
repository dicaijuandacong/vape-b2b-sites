// ============================================================
// Bitable-backed durable KV for ops-board mutations.
// ============================================================
// Vercel's serverless filesystem is EPHEMERAL — local JSON files
// (catalog overrides, site listings) are wiped on every deploy.
// This KV stores those blobs in the Feishu Bitable `ops_kv` table
// so mutations survive redeploys. Gated by FEISHU_OPSKV_TABLE_ID:
//  - env set    → Bitable is the source of truth (local file kept as cache)
//  - env unset  → local file only (dev)
//
// Write results are DISCRIMINATED — callers must throw on 'failed'
// so the API surfaces the loss instead of silently succeeding:
//  - 'ok'      → durable write landed in Bitable
//  - 'skipped' → Bitable not configured (dev); local file is the source
//  - 'failed'  → Bitable configured but the write FAILED (data NOT durable)
//
// Table schema (ops_kv): key (text, primary) / value (text, JSON) / 更新时间 (date, auto)
// Server-only; uses fetch, no fs.
// ============================================================

import { getTenantAccessToken, readFeishuConfig } from './feishu-base';

const OPSKV_TABLE_ID = () => process.env.FEISHU_OPSKV_TABLE_ID ?? '';

/** Internal keys only — validated to keep logs/fields injection-free. */
const SAFE_KEY_RE = /^[a-z0-9_]{1,64}$/;

function recordsUrl(): string {
  const cfg = readFeishuConfig();
  return `https://open.feishu.cn/open-apis/bitable/v1/apps/${cfg.bitableAppToken}/tables/${OPSKV_TABLE_ID()}/records`;
}

function isConfigured(): boolean {
  return (
    !!OPSKV_TABLE_ID() && !!process.env.FEISHU_APP_ID && !!process.env.FEISHU_BITABLE_APP_TOKEN
  );
}

/** Read a JSON blob from the ops_kv table. Returns null when unset/unavailable. */
export async function kvGet<T>(key: string): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const token = await getTenantAccessToken();
    const res = await fetch(`${recordsUrl()}?page_size=500`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    const data = (await res.json()) as {
      code: number;
      msg?: string;
      data?: { items?: Array<{ record_id?: string; fields?: Record<string, unknown> }> };
    };
    if (data.code !== 0) throw new Error(data.msg ?? `code ${data.code}`);
    const item = (data.data?.items ?? []).find((it) => {
      const f = it.fields?.['key'];
      return typeof f === 'string' && f === key;
    });
    if (!item) return null;
    const v = item.fields?.['value'];
    if (typeof v !== 'string' || !v) return null;
    return JSON.parse(v) as T;
  } catch (e) {
    // Sanitized log: message only — never URLs/headers (they carry the token).
    console.error('[ops-kv] get failed:', e instanceof Error ? e.message : 'unknown error');
    return null;
  }
}

/** Write a JSON blob to the ops_kv table (upsert by key). */
export async function kvSet(key: string, value: unknown): Promise<'ok' | 'failed' | 'skipped'> {
  if (!SAFE_KEY_RE.test(key)) {
    console.error('[ops-kv] set rejected: unsafe key');
    return 'failed';
  }
  if (!isConfigured()) return 'skipped'; // dev: local file is the source of truth
  try {
    const token = await getTenantAccessToken();
    const payload = {
      fields: {
        key,
        value: JSON.stringify(value),
        更新时间: Date.now()
      }
    };
    // find existing record to upsert
    const res = await fetch(`${recordsUrl()}?page_size=500`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    const data = (await res.json()) as {
      code: number;
      data?: { items?: Array<{ record_id?: string; fields?: Record<string, unknown> }> };
    };
    if (data.code !== 0) throw new Error(`list failed (code ${data.code})`);
    const item = (data.data?.items ?? []).find((it) => it.fields?.['key'] === key);
    const url = item?.record_id ? `${recordsUrl()}/${item.record_id}` : recordsUrl();
    const method = item?.record_id ? 'PUT' : 'POST';
    const wres = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    const wdata = (await wres.json()) as { code: number; msg?: string };
    if (wdata.code !== 0) throw new Error(wdata.msg ?? `write code ${wdata.code}`);
    return 'ok';
  } catch (e) {
    // Sanitized log: message only — never URLs/headers (they carry the token).
    console.error('[ops-kv] set failed:', e instanceof Error ? e.message : 'unknown error');
    return 'failed';
  }
}
