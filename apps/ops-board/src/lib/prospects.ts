import { getTenantAccessToken, readFeishuConfig } from '@/lib/feishu-base';
import { cachedQuery, invalidateCache } from '@/lib/cache';

/**
 * 潜在客户（欧洲雾化店外呼清单）数据访问层（仅服务端）。
 *
 * 数据源：飞书 Bitable prospects 表（Google Maps 抓取写入，见
 * maps-leads/upload_to_feishu.py）。字段：名称/国家/城市/地址/电话/网站/
 * 邮箱/评分/评论数/外呼状态/来源/place_id/经度/纬度/备注/抓取时间。
 *
 * 未配置 FEISHU_PROSPECTS_TABLE_ID 时回退内置 mock，保证页面可渲染。
 */

export const PROSPECT_STATUSES = [
  '未触达',
  '已发WhatsApp',
  '已发邮件',
  '已回复',
  '无兴趣',
  '成交',
  '无效'
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export function isProspectStatus(v: string): v is ProspectStatus {
  return (PROSPECT_STATUSES as readonly string[]).includes(v);
}

export interface Prospect {
  id: string;
  name: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  rating: number | null;
  reviews: number | null;
  status: ProspectStatus;
  source: string;
  placeId: string;
  notes: string;
  scrapedAt: string;
  priority: string;
  pain: string;
  opener: string;
}

export interface ProspectsResponse {
  prospects: Prospect[];
  source: 'feishu' | 'mock';
}

function hasFeishuEnv(): boolean {
  return Boolean(
    process.env.FEISHU_APP_ID &&
    process.env.FEISHU_APP_SECRET &&
    process.env.FEISHU_BITABLE_APP_TOKEN &&
    process.env.FEISHU_PROSPECTS_TABLE_ID
  );
}

const BITABLE_RECORDS_URL = (appToken: string, tableId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

// ---------- Bitable 字段值解析（与 leads.ts 同套容错） ----------

function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => asText(item)).join('');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.link === 'string') return record.link;
  }
  return '';
}

function asOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = asText(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function asOptionalIsoDate(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function asStatus(value: unknown): ProspectStatus {
  const text = asText(value).trim();
  return isProspectStatus(text) ? text : '未触达';
}

interface BitableRecord {
  record_id?: string;
  fields?: Record<string, unknown>;
}

function mapRecord(record: BitableRecord): Prospect | null {
  const fields = record.fields ?? {};
  const name = asText(fields['名称']).trim();
  if (!name || !record.record_id) return null;

  const website = asText(fields['网站']).trim();
  return {
    id: record.record_id,
    name,
    country: asText(fields['国家']).trim(),
    city: asText(fields['城市']).trim(),
    address: asText(fields['地址']).trim(),
    phone: asText(fields['电话']).trim(),
    website,
    email: asText(fields['邮箱']).trim(),
    rating: asOptionalNumber(fields['评分']),
    reviews: asOptionalNumber(fields['评论数']),
    status: asStatus(fields['外呼状态']),
    source: asText(fields['来源']).trim(),
    placeId: asText(fields['place_id']).trim(),
    notes: asText(fields['备注']).trim(),
    scrapedAt: asOptionalIsoDate(fields['抓取时间']) ?? '',
    priority: asText(fields['优先级']).trim(),
    pain: asText(fields['痛点']).trim(),
    opener: asText(fields['开场白']).trim()
  };
}

// ---------- 飞书读取 / 更新 ----------

interface BitableListResponse {
  code: number;
  msg?: string;
  data?: { items?: BitableRecord[]; has_more?: boolean; page_token?: string };
}

async function fetchAllProspects(): Promise<Prospect[]> {
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const prospects: Prospect[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      BITABLE_RECORDS_URL(cfg.bitableAppToken, process.env.FEISHU_PROSPECTS_TABLE_ID ?? '')
    );
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`feishu list prospects HTTP ${res.status}`);
    const data = (await res.json()) as BitableListResponse;
    if (data.code !== 0) {
      throw new Error(`feishu list prospects failed: ${data.msg ?? data.code}`);
    }
    for (const record of data.data?.items ?? []) {
      const p = mapRecord(record);
      if (p) prospects.push(p);
    }
    pageToken = data.data?.has_more ? data.data?.page_token : undefined;
  } while (pageToken);

  return prospects;
}

export async function getProspects(): Promise<ProspectsResponse> {
  if (!hasFeishuEnv()) {
    return { prospects: MOCK_PROSPECTS, source: 'mock' };
  }
  try {
    const prospects = await cachedQuery('prospects_all', fetchAllProspects);
    return { prospects, source: 'feishu' };
  } catch (error) {
    console.error('[prospects] feishu fetch failed, falling back to mock:', error);
    return { prospects: MOCK_PROSPECTS, source: 'mock' };
  }
}

/** 更新单条潜在客户的「外呼状态」；mock 模式直接成功。 */
export async function updateProspectStatus(
  recordId: string,
  status: ProspectStatus
): Promise<{ ok: true; source: 'feishu' | 'mock' }> {
  if (!hasFeishuEnv()) return { ok: true, source: 'mock' };
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const res = await fetch(
    `${BITABLE_RECORDS_URL(cfg.bitableAppToken, process.env.FEISHU_PROSPECTS_TABLE_ID ?? '')}/${recordId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ fields: { 外呼状态: status } })
    }
  );
  if (!res.ok) throw new Error(`feishu update prospect HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) {
    throw new Error(`feishu update prospect failed: ${data.msg ?? data.code}`);
  }
  void invalidateCache('prospects_all');
  return { ok: true, source: 'feishu' };
}

// ---------- 内置 mock（抓取跑完前占位） ----------

const MOCK_PROSPECTS: Prospect[] = [
  {
    id: 'proMock001',
    name: 'Dampf Palast Berlin',
    country: '德国',
    city: 'Berlin',
    address: 'Kastanienallee 42, 10435 Berlin',
    phone: '+49 30 1234 5678',
    website: 'https://dampf-palast.example.de',
    email: '',
    rating: 4.6,
    reviews: 312,
    status: '未触达',
    source: 'Google Maps',
    placeId: 'mock-1',
    notes: '',
    scrapedAt: '2026-08-20T10:00:00.000Z',
    priority: 'A',
    pain: '',
    opener:
      'Hi Dampf Palast Berlin team — we are a wholesale supplier serving Berlin vape shops (EU-compliant disposables, MOQ-friendly). Happy to send our latest price list?'
  },
  {
    id: 'proMock002',
    name: 'Vapoteur Paris 11e',
    country: '法国',
    city: 'Paris',
    address: 'Rue Oberkampf 15, 75011 Paris',
    phone: '+33 1 23 45 67 89',
    website: '',
    email: '',
    rating: 4.2,
    reviews: 87,
    status: '未触达',
    source: 'Google Maps',
    placeId: 'mock-2',
    notes: '',
    scrapedAt: '2026-08-20T10:00:00.000Z',
    priority: 'B',
    pain: '价格贵',
    opener:
      'Hi Vapoteur Paris 11e team — noticed a few of your Google reviews mention pricing pressure. We help Paris vape shops keep shelves full with EU-compliant disposables at wholesale prices. Mind if I send over our latest price list?'
  },
  {
    id: 'proMock003',
    name: 'Cloud Nine Vape London',
    country: '英国',
    city: 'London',
    address: '123 Shoreditch High St, London E1 6JE',
    phone: '+44 20 7946 0102',
    website: 'https://cloudnine.example.co.uk',
    email: 'hello@cloudnine.example.co.uk',
    rating: 4.8,
    reviews: 540,
    status: '未触达',
    source: 'Google Maps',
    placeId: 'mock-3',
    notes: '',
    scrapedAt: '2026-08-20T10:00:00.000Z',
    priority: 'S',
    pain: '',
    opener:
      'Hi Cloud Nine Vape London team — we are a wholesale supplier serving London vape shops (EU-compliant disposables, e-liquids & accessories, MOQ-friendly). Happy to send our latest price list?'
  }
];
