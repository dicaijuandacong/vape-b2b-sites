import { getTenantAccessToken, readFeishuConfig } from '@/lib/feishu-base';
import { cachedQuery, invalidateCache } from '@/lib/cache';
import {
  isLeadStatus,
  SITE_KEYS,
  type Lead,
  type LeadsResponse,
  type LeadSite,
  type LeadStatus,
  type LeadType
} from '@/features/kanban/api/types';

/**
 * 询盘数据访问层（仅服务端）。
 *
 * 数据源：飞书 Bitable leads 表（中文字段名，见 feishu-base.ts 的 mapLeadToFields）。
 * 未配置飞书环境变量或拉取失败时，回退到内置 mock 列表，保证看板始终可渲染。
 */

function hasFeishuEnv(): boolean {
  return Boolean(
    process.env.FEISHU_APP_ID &&
    process.env.FEISHU_APP_SECRET &&
    process.env.FEISHU_BITABLE_APP_TOKEN &&
    process.env.FEISHU_LEADS_TABLE_ID
  );
}

const BITABLE_RECORDS_URL = (appToken: string, tableId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

// ---------- Bitable 字段值解析 ----------

/** Bitable 文本字段读出来可能是 string / [{type:'text',text:'...'}] / {text,link} / number。 */
function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).join('');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.link === 'string') return record.link;
  }
  return '';
}

function asOptionalText(value: unknown): string | undefined {
  const text = asText(value).trim();
  return text ? text : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map((item) => asText(item).trim()).filter((item) => item.length > 0);
    return items.length ? items : undefined;
  }
  const single = asText(value).trim();
  return single ? [single] : undefined;
}

/** 「创建时间」自动字段返回毫秒时间戳；兼容 ISO 字符串。 */
function asIsoDate(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (text) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/** 可选日期字段：毫秒时间戳或 ISO 字符串；解析不出来返回 undefined。 */
function asOptionalIsoDate(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function asSite(value: unknown): LeadSite {
  const text = asText(value).trim().toLowerCase();
  return (SITE_KEYS as readonly string[]).includes(text) ? (text as LeadSite) : 'europe';
}

function asStatus(value: unknown): LeadStatus {
  const text = asText(value).trim();
  return isLeadStatus(text) ? text : '新询盘';
}

function asType(value: unknown): LeadType {
  return asText(value).trim() === 'newsletter' ? 'newsletter' : 'wholesale';
}

interface BitableRecord {
  record_id?: string;
  fields?: Record<string, unknown>;
}

/** 映射一条 Bitable record → Lead；邮箱为空的行返回 null（跳过）。 */
function mapRecord(record: BitableRecord): Lead | null {
  const fields = record.fields ?? {};
  const email = asText(fields['邮箱']).trim();
  if (!email || !record.record_id) return null;

  return {
    id: record.record_id,
    site: asSite(fields['来源站']),
    type: asType(fields['类型']),
    email,
    company: asOptionalText(fields['公司']),
    country: asOptionalText(fields['国家']),
    phone: asOptionalText(fields['电话']),
    brands: asStringArray(fields['意向品牌']),
    volume: asOptionalText(fields['采购量级']),
    notes: asOptionalText(fields['备注']),
    status: asStatus(fields['状态']),
    createdAt: asIsoDate(fields['创建时间']),
    lastFollowAt: asOptionalIsoDate(fields['最后跟进'])
  };
}

// ---------- 飞书读取 / 更新 ----------

interface BitableListResponse {
  code: number;
  msg?: string;
  data?: {
    items?: BitableRecord[];
    has_more?: boolean;
    page_token?: string;
  };
}

async function fetchAllLeadRecords(): Promise<Lead[]> {
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const leads: Lead[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(BITABLE_RECORDS_URL(cfg.bitableAppToken, cfg.leadsTableId));
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`feishu list records HTTP ${res.status}`);

    const data = (await res.json()) as BitableListResponse;
    if (data.code !== 0) {
      throw new Error(`feishu list records failed: ${data.msg ?? data.code}`);
    }

    for (const record of data.data?.items ?? []) {
      const lead = mapRecord(record);
      if (lead) leads.push(lead);
    }

    pageToken = data.data?.has_more ? data.data?.page_token : undefined;
  } while (pageToken);

  return leads;
}

/** 读取全部询盘；飞书不可用（未配置 / 请求失败）时回退 mock。30 分钟缓存。 */
export async function getLeads(): Promise<LeadsResponse> {
  if (!hasFeishuEnv()) {
    return { leads: MOCK_LEADS, source: 'mock' };
  }
  try {
    const leads = await cachedQuery('leads_all', fetchAllLeadRecords);
    return { leads, source: 'feishu' };
  } catch (error) {
    console.error('[leads] feishu fetch failed, falling back to mock:', error);
    return { leads: MOCK_LEADS, source: 'mock' };
  }
}

/** 更新单条询盘的「状态」字段；未配置飞书时直接成功（mock 模式不持久化）。 */
export async function updateLeadStatus(
  recordId: string,
  status: LeadStatus
): Promise<{ ok: true; source: 'feishu' | 'mock' }> {
  if (!hasFeishuEnv()) {
    return { ok: true, source: 'mock' };
  }
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const res = await fetch(
    `${BITABLE_RECORDS_URL(cfg.bitableAppToken, cfg.leadsTableId)}/${recordId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ fields: { 状态: status } })
    }
  );
  if (!res.ok) throw new Error(`feishu update status HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) {
    throw new Error(`feishu update status failed: ${data.msg ?? data.code}`);
  }
  void invalidateCache('leads_all');
  return { ok: true, source: 'feishu' };
}

/** 刷新单条询盘的「最后跟进」日期字段；未配置飞书时直接返回（mock 模式不持久化）。 */
export async function updateLeadLastFollow(recordId: string, iso: string): Promise<void> {
  if (!hasFeishuEnv()) return;
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const when = new Date(iso).getTime();
  const res = await fetch(
    `${BITABLE_RECORDS_URL(cfg.bitableAppToken, cfg.leadsTableId)}/${recordId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        fields: { 最后跟进: Number.isNaN(when) ? Date.now() : when }
      })
    }
  );
  if (!res.ok) throw new Error(`feishu update last-follow HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) {
    throw new Error(`feishu update last-follow failed: ${data.msg ?? data.code}`);
  }
}

/** 询盘详情编辑（可编辑字段的子集；邮箱/来源站/类型不可改，避免破坏去重和归因）。 */
export interface EditableLeadFields {
  company?: string;
  country?: string;
  phone?: string;
  brands?: string[];
  volume?: string;
  notes?: string;
}

export async function updateLeadFields(
  recordId: string,
  input: EditableLeadFields
): Promise<{ ok: true; source: 'feishu' | 'mock' }> {
  if (!hasFeishuEnv()) return { ok: true, source: 'mock' };
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const fields: Record<string, unknown> = {};
  if (input.company !== undefined) fields['公司'] = input.company;
  if (input.country !== undefined) fields['国家'] = input.country;
  if (input.phone !== undefined) fields['电话'] = input.phone;
  if (input.brands !== undefined) fields['意向品牌'] = input.brands;
  if (input.volume !== undefined) fields['采购量级'] = input.volume;
  if (input.notes !== undefined) fields['备注'] = input.notes;
  if (Object.keys(fields).length === 0) return { ok: true, source: 'feishu' };

  const res = await fetch(
    `${BITABLE_RECORDS_URL(cfg.bitableAppToken, cfg.leadsTableId)}/${recordId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ fields })
    }
  );
  if (!res.ok) throw new Error(`feishu update fields HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) {
    throw new Error(`feishu update fields failed: ${data.msg ?? data.code}`);
  }
  void invalidateCache('leads_all');
  return { ok: true, source: 'feishu' };
}

// ---------- 内置 mock 数据 ----------

const MOCK_LEADS: Lead[] = [
  {
    id: 'recMock001',
    site: 'dubai',
    type: 'wholesale',
    email: 'purchasing@almezwan-vape.ae',
    company: 'Al Mezwan Trading LLC',
    country: 'UAE',
    phone: '+971 50 123 4567',
    brands: ['ELF BAR', 'LOST MARY'],
    volume: '5000 支/月',
    notes: '斋月前备货，要求迪拜仓自提',
    status: '新询盘',
    createdAt: '2026-08-15T09:24:00.000Z'
  },
  {
    id: 'recMock002',
    site: 'gulf',
    type: 'wholesale',
    email: 'info@riyadhvape.sa',
    company: 'Riyadh Vape Co.',
    country: 'Saudi Arabia',
    brands: ['VAPORESSO'],
    volume: '2000 支/月',
    status: '新询盘',
    createdAt: '2026-08-16T14:03:00.000Z'
  },
  {
    id: 'recMock003',
    site: 'europe',
    type: 'newsletter',
    email: 'm.bakker@dutchvape.nl',
    company: 'Dutch Vape Wholesale BV',
    country: 'Netherlands',
    status: '已联系',
    createdAt: '2026-08-12T08:41:00.000Z'
  },
  {
    id: 'recMock004',
    site: 'dubai',
    type: 'wholesale',
    email: 'omar@cloudnine.ae',
    company: 'Cloud Nine Smoke Shop',
    country: 'UAE',
    phone: '+971 55 987 6543',
    brands: ['GEEK BAR', 'RAZ'],
    volume: '10000 支/月',
    notes: '已有清关代理，报 DDP 价',
    status: '已报价',
    createdAt: '2026-08-10T11:15:00.000Z'
  },
  {
    id: 'recMock005',
    site: 'gulf',
    type: 'wholesale',
    email: 'khalid@dohacloud.qa',
    company: 'Doha Cloud Trading',
    country: 'Qatar',
    phone: '+974 3312 4455',
    brands: ['ELF BAR'],
    volume: '3000 支/月',
    status: '样品单',
    createdAt: '2026-08-08T16:52:00.000Z'
  },
  {
    id: 'recMock006',
    site: 'europe',
    type: 'wholesale',
    email: 'einkauf@dampf-palast.de',
    company: 'Dampf Palast GmbH',
    country: 'Germany',
    brands: ['VUSE', 'VAPORESSO'],
    volume: '8000 支/月',
    notes: '要求 TPD 合规版本',
    status: '成交',
    createdAt: '2026-07-28T10:05:00.000Z'
  },
  {
    id: 'recMock007',
    site: 'europe',
    type: 'newsletter',
    email: 'hola@vapormadrid.es',
    country: 'Spain',
    status: '流失',
    createdAt: '2026-07-20T13:37:00.000Z'
  },
  {
    id: 'recMock008',
    site: 'dubai',
    type: 'wholesale',
    email: 'sales@falconvape.ae',
    company: 'Falcon Vape Distribution',
    country: 'UAE',
    phone: '+971 52 444 8899',
    brands: ['LOST MARY', 'HAYATI'],
    volume: '15000 支/月',
    status: '待跟进',
    createdAt: '2026-08-05T07:58:00.000Z'
  },
  {
    id: 'recMock009',
    site: 'gulf',
    type: 'newsletter',
    email: 'a.alrashid@kuwaitvape.kw',
    company: 'Kuwait Vape Store',
    country: 'Kuwait',
    status: '已联系',
    createdAt: '2026-08-14T19:22:00.000Z'
  },
  {
    id: 'recMock010',
    site: 'europe',
    type: 'wholesale',
    email: 'orders@vapegrossisten.se',
    company: 'Vapegrossisten AB',
    country: 'Sweden',
    brands: ['GEEK BAR'],
    volume: '4000 支/月',
    status: '已报价',
    createdAt: '2026-08-11T06:49:00.000Z'
  },
  {
    id: 'recMock011',
    site: 'vapegogogo',
    type: 'wholesale',
    email: 'buyer@ecig-city.fr',
    company: 'ECig City SARL',
    country: 'France',
    phone: '+33 6 12 34 56 78',
    brands: ['BANG KING', 'FUMOT'],
    volume: '6000 支/月',
    notes: 'vapegogogo.com 站测试询盘',
    status: '新询盘',
    createdAt: '2026-08-17T10:12:00.000Z'
  }
];
