// 一次性验证脚本：真实跑一遍 ensureAuditTable 的 Bitable 流程
// （list 按名查找 → 缺失则建表 → table_id 写入 ops_kv）。
// 与 src/lib/audit.ts 的 ensureAuditTable() 相同的 API 调用序列，
// 复用 feishu-base.ts 的 token/配置（该文件零依赖可直接 import）。
// 运行：node scripts/verify-audit-table.mjs
import { readFileSync } from 'node:fs';
import { getTenantAccessToken, readFeishuConfig } from '../src/lib/feishu-base.ts';

// 加载 .env.local（不覆盖已有 env）
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
}

const AUDIT_TABLE_NAME = '审计日志';
const KV_KEY = 'audit_table_id';
const FIELDS = [
  { field_name: '时间', type: 1 },
  { field_name: '操作人', type: 1 },
  { field_name: '动作', type: 1 },
  { field_name: '对象', type: 1 },
  { field_name: '详情', type: 1 }
];

const cfg = readFeishuConfig();
const token = await getTenantAccessToken();
const tablesUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${cfg.bitableAppToken}/tables`;
const kvUrl = `${tablesUrl}/${process.env.FEISHU_OPSKV_TABLE_ID}/records`;

// 1. ops_kv 里已有？
const kvRes = await fetch(`${kvUrl}?page_size=500`, {
  headers: { Authorization: `Bearer ${token}` }
});
const kvData = await kvRes.json();
const kvHit = (kvData.data?.items ?? []).find((it) => it.fields?.key === KV_KEY);
if (kvHit) {
  console.log('ops_kv 已有 audit_table_id:', JSON.parse(kvHit.fields.value));
  process.exit(0);
}

// 2. 按表名查找
const listRes = await fetch(`${tablesUrl}?page_size=100`, {
  headers: { Authorization: `Bearer ${token}` }
});
const listData = await listRes.json();
if (listData.code !== 0) throw new Error(`list tables failed: ${listData.msg}`);
const existing = (listData.data?.items ?? []).find((t) => t.name === AUDIT_TABLE_NAME);

let tableId;
if (existing?.table_id) {
  tableId = existing.table_id;
  console.log('已存在同名表，复用:', tableId);
} else {
  // 3. 建表
  const createRes = await fetch(tablesUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ table: { name: AUDIT_TABLE_NAME, fields: FIELDS } })
  });
  const createData = await createRes.json();
  if (createData.code !== 0) throw new Error(`create table failed: ${createData.msg}`);
  tableId = createData.data?.table_id;
  console.log('建表成功:', tableId);
}

// 4. table_id 写回 ops_kv（upsert）
const wRes = await fetch(kvUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ fields: { key: KV_KEY, value: JSON.stringify(tableId), 更新时间: Date.now() } })
});
const wData = await wRes.json();
if (wData.code !== 0) throw new Error(`kv write failed: ${wData.msg}`);
console.log('table_id 已写入 ops_kv:', KV_KEY, '=', tableId);

// 5. 追加一条验证记录再读回（证明字段映射可用）
const recRes = await fetch(`${tablesUrl}/${tableId}/records`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    fields: {
      时间: new Date().toISOString(),
      操作人: '系统（运营）',
      动作: 'audit.table.verify',
      对象: 'verify-audit-table.mjs',
      详情: '建表链路验证：写入 + 读取'
    }
  })
});
const recData = await recRes.json();
if (recData.code !== 0) throw new Error(`append record failed: ${recData.msg}`);
console.log('验证记录已追加, record_id =', recData.data?.record?.record_id);
