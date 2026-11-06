// ============================================================
// 审计日志 — Bitable 优先（生产持久层），本地 JSONL 兜底（开发）
// ============================================================
// 仅服务端（node runtime）使用；proxy.ts / 客户端组件禁止 import
// 本模块（依赖 fs）。
//
// 背景：Vercel 的 serverless 文件系统是临时的 —— 旧实现只写
// data/audit-log.jsonl，每次部署清空、跨实例碎片化。现在：
//  1. 优先写飞书 Bitable「审计日志」表（首次使用自动建表；
//     table_id 存 ops_kv 的 audit_table_id，env FEISHU_AUDIT_TABLE_ID
//     可直接覆盖；建表前先按表名查找，避免 ops_kv 丢失后重复建表）
//  2. 建表/写入失败 → console.error 可见降级，回退本地文件模式
//     （Vercel 上不持久，但绝不静默）
//  3. 非 Vercel 环境写 Bitable 的同时也追加本地文件，方便开发排查
//
// 每条记录：{ at, actorName, actorRole, action, target, detail? }
// actorName 已经过 displayNameFor 脱敏（管理员显示「Admin」）。
// 写失败只打 console.error，绝不影响主流程（审计不能打断业务操作）。
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';
import { auth } from '@/auth';
import { displayNameFor, roleForUser, type Role } from '@/lib/rbac';
import { getTenantAccessToken, readFeishuConfig } from '@/lib/feishu-base';
import { kvGet, kvSet } from '@/lib/bitable-kv';
import { collectAllPages, newestFirst } from '@/lib/audit-query';

export interface AuditEntry {
  /** ISO 时间戳 */
  at: string;
  actorName: string;
  actorRole: Role;
  /** 动作标识，如 product.create / lead.status.update / deploy.trigger */
  action: string;
  /** 操作对象，如 product id / lead id / 媒体 id */
  target: string;
  detail?: string;
}

const AUDIT_FILE = path.join(process.cwd(), 'data', 'audit-log.jsonl');

// ---------- Bitable「审计日志」表 ----------

const AUDIT_TABLE_NAME = '审计日志';
const AUDIT_TABLE_KV_KEY = 'audit_table_id';
/** Bitable 字段类型 1 = 多行文本。 */
const TEXT_FIELD = 1;
const AUDIT_TABLE_FIELDS = [
  { field_name: '时间', type: TEXT_FIELD },
  { field_name: '操作人', type: TEXT_FIELD },
  { field_name: '动作', type: TEXT_FIELD },
  { field_name: '对象', type: TEXT_FIELD },
  { field_name: '详情', type: TEXT_FIELD }
];

/** 进程内缓存已解析的 table_id（只缓存成功结果；失败不缓存，下次写入重试）。 */
let auditTableIdCache: string | null | undefined;

function bitableTablesUrl(): string {
  const cfg = readFeishuConfig();
  return `https://open.feishu.cn/open-apis/bitable/v1/apps/${cfg.bitableAppToken}/tables`;
}

/** 审计记录 → Bitable 行字段（中文列名；角色编码进「操作人」后缀）。 */
function entryToFields(entry: AuditEntry): Record<string, string> {
  const roleLabel = entry.actorRole === 'admin' ? '管理员' : '运营';
  return {
    时间: entry.at,
    操作人: `${entry.actorName}（${roleLabel}）`,
    动作: entry.action,
    对象: entry.target,
    详情: entry.detail ?? ''
  };
}

/** Bitable 行字段 → 审计记录；「操作人」尾部的（管理员/运营）解析回角色。 */
function fieldsToEntry(fields: Record<string, unknown>): AuditEntry | null {
  const asText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(asText).join('');
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  };
  const op = asText(fields['操作人']);
  if (!op) return null;
  const roleMatch = op.match(/（(管理员|运营)）$/);
  return {
    at: asText(fields['时间']) || new Date().toISOString(),
    actorName: roleMatch ? op.slice(0, op.length - roleMatch[0].length) : op,
    actorRole: roleMatch?.[1] === '管理员' ? ('admin' as const) : ('operator' as const),
    action: asText(fields['动作']),
    target: asText(fields['对象']),
    detail: asText(fields['详情']) || undefined
  };
}

/**
 * 解析「审计日志」表 table_id：env FEISHU_AUDIT_TABLE_ID → ops_kv →
 * 按表名查找 → 自动建表。失败 console.error 并返回 null（回退本地文件模式）。
 */
export async function ensureAuditTable(): Promise<string | null> {
  if (auditTableIdCache !== undefined) return auditTableIdCache;
  let resolved: string | null = null;
  try {
    const fromEnv = process.env.FEISHU_AUDIT_TABLE_ID;
    if (fromEnv) {
      resolved = fromEnv;
    } else {
      await readFeishuConfig(); // 需要 FEISHU_* env 齐全
      const fromKv = await kvGet<string>(AUDIT_TABLE_KV_KEY);
      if (fromKv && typeof fromKv === 'string') {
        resolved = fromKv;
      } else {
        const token = await getTenantAccessToken();
        // 先按名找：ops_kv 记录丢失时复用已存在的表，避免重复建表
        const listRes = await fetch(`${bitableTablesUrl()}?page_size=100`, {
          headers: { Authorization: `Bearer ${token}` },
          next: { revalidate: 0 }
        });
        const listData = (await listRes.json()) as {
          code: number;
          msg?: string;
          data?: { items?: Array<{ table_id?: string; name?: string }> };
        };
        if (listData.code !== 0) {
          throw new Error(`list tables failed: ${listData.msg ?? listData.code}`);
        }
        const existing = (listData.data?.items ?? []).find(
          (t) => t.name === AUDIT_TABLE_NAME && t.table_id
        );
        if (existing?.table_id) {
          resolved = existing.table_id;
          await kvSet(AUDIT_TABLE_KV_KEY, resolved); // 尽力回填 ops_kv，失败不阻断
        } else {
          const createRes = await fetch(bitableTablesUrl(), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ table: { name: AUDIT_TABLE_NAME, fields: AUDIT_TABLE_FIELDS } })
          });
          const createData = (await createRes.json()) as {
            code: number;
            msg?: string;
            data?: { table_id?: string };
          };
          if (createData.code !== 0 || !createData.data?.table_id) {
            throw new Error(`create table failed: ${createData.msg ?? createData.code}`);
          }
          const tableId = createData.data.table_id;
          // 持久化失败就不启用自动建的表：否则每个冷启动都会再建一张
          if ((await kvSet(AUDIT_TABLE_KV_KEY, tableId)) !== 'ok') {
            throw new Error('table created but persisting table_id to ops_kv failed');
          }
          console.log('[audit] 已在 Bitable 自动创建「审计日志」表:', tableId);
          resolved = tableId;
        }
      }
    }
  } catch (e) {
    console.error(
      '[audit] 审计表不可用，回退本地文件模式（Vercel 上不持久）:',
      e instanceof Error ? e.message : e
    );
    resolved = null;
  }
  if (resolved) auditTableIdCache = resolved;
  return resolved;
}

async function appendBitableAudit(tableId: string, entry: AuditEntry): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${bitableTablesUrl()}/${tableId}/records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ fields: entryToFields(entry) })
  });
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) throw new Error(`append record failed: ${data.msg ?? data.code}`);
}

async function readBitableAudit(tableId: string, limit: number): Promise<AuditEntry[]> {
  const token = await getTenantAccessToken();
  const base = `${bitableTablesUrl()}/${tableId}/records`;
  // Bitable list API 按写入顺序（旧→新）分页返回，新记录在最后一页。
  // 旧实现只读第一页（page_size=500）：表超过 500 条后新审计永远进不了
  // 审计页，页面冻结在过去。search API 的 sort 参数对多行文本字段的支持
  // 未经官方文档确认（文档站为 SPA 无法核验），故选择保证正确的路径：
  // page_token 翻到尾取全量，再本地按时间倒序截取前 limit 条。
  const all = await collectAllPages(async (pageToken) => {
    const url = `${base}?page_size=500${pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 }
    });
    const data = (await res.json()) as {
      code: number;
      msg?: string;
      data?: {
        items?: Array<{ fields?: Record<string, unknown> }>;
        has_more?: boolean;
        page_token?: string;
      };
    };
    if (data.code !== 0) throw new Error(`list records failed: ${data.msg ?? data.code}`);
    return {
      items: (data.data?.items ?? [])
        .map((item) => fieldsToEntry(item.fields ?? {}))
        .filter((e): e is AuditEntry => e !== null),
      hasMore: data.data?.has_more === true,
      ...(data.data?.page_token ? { pageToken: data.data.page_token } : {})
    };
  });
  // 反转（新写入的在前）后再稳定排序：同时间戳时新记录排前，与旧实现一致
  return newestFirst(all.reverse(), limit);
}

// ---------- 本地文件（开发副本 / 兜底） ----------

async function appendLocalAudit(entry: AuditEntry): Promise<void> {
  try {
    await fs.mkdir(path.dirname(AUDIT_FILE), { recursive: true });
    await fs.appendFile(AUDIT_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (e) {
    console.error('[audit] 本地文件写入失败:', e instanceof Error ? e.message : e);
  }
}

async function readLocalAudit(limit: number): Promise<AuditEntry[]> {
  try {
    const raw = await fs.readFile(AUDIT_FILE, 'utf8');
    const entries: AuditEntry[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        entries.push(JSON.parse(trimmed) as AuditEntry);
      } catch {
        // 跳过坏行
      }
    }
    return entries.reverse().slice(0, limit);
  } catch {
    return [];
  }
}

// ---------- 对外 API ----------

/** 追加一条审计记录（原始入口，调用方需自行组装 actor 信息）。 */
export async function writeAudit(entry: Omit<AuditEntry, 'at'>): Promise<void> {
  const full: AuditEntry = { at: new Date().toISOString(), ...entry };
  const tableId = await ensureAuditTable();
  if (tableId) {
    try {
      await appendBitableAudit(tableId, full);
    } catch (e) {
      // 审计不能打断业务操作：Bitable 写失败只记录，不抛
      console.error(
        '[audit] Bitable 写入失败（业务不受影响）:',
        e instanceof Error ? e.message : e
      );
    }
    // 非 Vercel（本地开发）同时留本地副本，方便 grep 排查
    if (!process.env.VERCEL) {
      await appendLocalAudit(full);
    }
    return;
  }
  // 审计表不可用（上方已 console.error 可见降级）→ 本地文件兜底
  await appendLocalAudit(full);
}

/** 从当前 session 解析操作者（含脱敏）并追加一条审计记录。 */
export async function recordAudit(action: string, target: string, detail?: string): Promise<void> {
  try {
    const session = await auth();
    await writeAudit({
      actorName: displayNameFor(session?.user),
      actorRole: roleForUser(session?.user),
      action,
      target,
      ...(detail ? { detail } : {})
    });
  } catch (e) {
    console.error('[audit] record failed:', e instanceof Error ? e.message : e);
  }
}

/**
 * 读取审计日志（新→旧，最多 limit 条）。
 * 优先读 Bitable；读取成功时（仅非 Vercel）合并本地文件里的历史记录并去重
 * （迁移期本地有旧数据；开发环境双写也靠去重避免显示两份）。
 * Bitable 读取失败 → 回退本地文件。
 */
export async function readAudit(limit = 500): Promise<AuditEntry[]> {
  const tableId = await ensureAuditTable();
  if (tableId) {
    try {
      const bitable = await readBitableAudit(tableId, limit);
      if (!process.env.VERCEL) {
        const local = await readLocalAudit(limit);
        if (local.length > 0) {
          const seen = new Set(bitable.map((e) => `${e.at}|${e.action}|${e.target}`));
          const merged = [...bitable];
          for (const e of local) {
            if (!seen.has(`${e.at}|${e.action}|${e.target}`)) merged.push(e);
          }
          return merged.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, limit);
        }
      }
      return bitable;
    } catch (e) {
      console.error('[audit] Bitable 读取失败，回退本地文件:', e instanceof Error ? e.message : e);
    }
  }
  return readLocalAudit(limit);
}
