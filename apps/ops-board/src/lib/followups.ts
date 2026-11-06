import { getTenantAccessToken, readFeishuConfig } from '@/lib/feishu-base';
import { getLeads, updateLeadLastFollow } from '@/lib/leads';
import { scheduleFollowupReminder } from '@/lib/calendar';
import { cachedQuery, invalidateCache } from '@/lib/cache';
import { mergeSources } from '@/lib/data-source';
import type { LeadSite, LeadStatus } from '@/features/kanban/api/types';

/**
 * 跟进数据访问层（仅服务端）。
 *
 * 数据源：飞书 Bitable `followups` 表，中文字段名：
 *   关联询盘 (link → leads 表 record_id 数组) / 时间 (date, ms 时间戳) /
 *   通道 (single-select: whatsapp|email|call|note) / 内容 (text) /
 *   下次动作 (text, 可选) / 下次跟进 (date, 可选)
 * 同时维护 leads 表的「最后跟进」日期字段。
 * 未配置飞书环境变量（缺 FEISHU_FOLLOWUPS_TABLE_ID 等）或拉取失败时，
 * 回退到内置 mock 数据，保证页面始终可渲染。
 */

export const FOLLOW_CHANNELS = ['whatsapp', 'email', 'telegram', 'call', 'note'] as const;

export type FollowChannel = (typeof FOLLOW_CHANNELS)[number];

export const FOLLOW_CHANNEL_LABELS: Record<FollowChannel, string> = {
  whatsapp: 'WhatsApp',
  email: '邮件',
  telegram: 'Telegram',
  call: '电话',
  note: '备注'
};

export function isFollowChannel(value: unknown): value is FollowChannel {
  return typeof value === 'string' && (FOLLOW_CHANNELS as readonly string[]).includes(value);
}

/** 一条跟进记录（followups 表的一行，已映射为英文字段）。 */
export interface Followup {
  /** 飞书 record_id（mock 模式下为本地生成 id） */
  id: string;
  /** 关联的询盘 record_id */
  leadId: string;
  /** ISO 时间字符串 */
  at: string;
  channel: FollowChannel;
  content: string;
  nextAction?: string;
  /** ISO 时间字符串 */
  nextFollowAt?: string;
}

export interface AddFollowupInput {
  leadId: string;
  channel: FollowChannel;
  content: string;
  nextAction?: string;
  nextFollowAt?: string;
  /** 公司名或邮箱（可选），用于飞书日历日程标题。 */
  leadLabel?: string;
}

export interface FollowupsResponse {
  followups: Followup[];
  source: 'feishu' | 'mock';
}

export interface AddFollowupResult {
  followup: Followup;
  source: 'feishu' | 'mock';
}

/** 一条待跟进任务（由跟进记录 + 询盘状态推导，不落库）。 */
export interface FollowupTask {
  leadId: string;
  company?: string;
  email: string;
  site: LeadSite;
  country?: string;
  /** 应跟进时间（ISO） */
  dueAt: string;
  /** 任务来源说明，如「发 HAYATI 报价单」/「3 天未跟进」 */
  reason: string;
  kind: 'scheduled' | 'stale';
  lastChannel?: FollowChannel;
}

export interface FollowupTasksResponse {
  tasks: FollowupTask[];
  source: 'feishu' | 'mock';
}

export type TaskUrgency = 'overdue' | 'today' | 'upcoming';

/** 状态在这些列里的询盘，超过 N 天没碰就算「僵住」，生成待跟进任务。 */
const STALE_STATUSES: readonly LeadStatus[] = ['新询盘', '已联系', '待跟进'];

/** 已成交 / 已流失的询盘不再生成任何待跟进任务。 */
const CLOSED_STATUSES: readonly LeadStatus[] = ['成交', '流失'];

/** 僵住判定阈值（天）。 */
export const FOLLOWUP_STALE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function hasFeishuEnv(): boolean {
  return Boolean(
    process.env.FEISHU_APP_ID &&
    process.env.FEISHU_APP_SECRET &&
    process.env.FEISHU_BITABLE_APP_TOKEN &&
    process.env.FEISHU_FOLLOWUPS_TABLE_ID
  );
}

function followupsTableId(): string {
  const tableId = process.env.FEISHU_FOLLOWUPS_TABLE_ID;
  if (!tableId) throw new Error('feishu env missing: FEISHU_FOLLOWUPS_TABLE_ID');
  return tableId;
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

/** 日期字段返回毫秒时间戳；兼容 ISO 字符串。解析不出来返回 undefined。 */
function asOptionalIso(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/** 关联询盘 link 字段：record_id 数组（元素可能是 string 或 {record_id} 对象）。 */
function asRecordIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item) {
      ids.push(item);
    } else if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const id = record.record_id ?? record.id;
      if (typeof id === 'string' && id) ids.push(id);
    }
  }
  return ids;
}

function asChannel(value: unknown): FollowChannel {
  const text = asText(value).trim();
  return isFollowChannel(text) ? text : 'note';
}

interface BitableRecord {
  record_id?: string;
  fields?: Record<string, unknown>;
}

/** 映射一条 Bitable record → Followup；缺关联询盘或 record_id 的行返回 null（跳过）。 */
function mapRecord(record: BitableRecord): Followup | null {
  const fields = record.fields ?? {};
  const leadId = asRecordIdArray(fields['关联询盘'])[0];
  if (!leadId || !record.record_id) return null;

  return {
    id: record.record_id,
    leadId,
    at: asOptionalIso(fields['时间']) ?? new Date().toISOString(),
    channel: asChannel(fields['通道']),
    content: asText(fields['内容']).trim(),
    nextAction: asOptionalText(fields['下次动作']),
    nextFollowAt: asOptionalIso(fields['下次跟进'])
  };
}

// ---------- 飞书读取 ----------

interface BitableListResponse {
  code: number;
  msg?: string;
  data?: {
    items?: BitableRecord[];
    has_more?: boolean;
    page_token?: string;
  };
}

async function fetchAllFollowupRecords(): Promise<Followup[]> {
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const followups: Followup[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(BITABLE_RECORDS_URL(cfg.bitableAppToken, followupsTableId()));
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`feishu list followups HTTP ${res.status}`);

    const data = (await res.json()) as BitableListResponse;
    if (data.code !== 0) {
      throw new Error(`feishu list followups failed: ${data.msg ?? data.code}`);
    }

    for (const record of data.data?.items ?? []) {
      const followup = mapRecord(record);
      if (followup) followups.push(followup);
    }

    pageToken = data.data?.has_more ? data.data?.page_token : undefined;
  } while (pageToken);

  return followups;
}

/** 内部版：带回数据源标记，供 getFollowupTasks 做跨源可信度合并。 */
async function getFollowupsWithSource(leadId?: string): Promise<FollowupsResponse> {
  let all: Followup[];
  let source: 'feishu' | 'mock';
  if (!hasFeishuEnv()) {
    all = MOCK_FOLLOWUPS;
    source = 'mock';
  } else {
    try {
      all = await cachedQuery('followups_all', fetchAllFollowupRecords);
      source = 'feishu';
    } catch (error) {
      console.error('[followups] feishu fetch failed, falling back to mock:', error);
      all = MOCK_FOLLOWUPS;
      source = 'mock';
    }
  }
  const filtered = leadId ? all.filter((item) => item.leadId === leadId) : [...all];
  const followups = filtered.sort((a, b) => (a.at < b.at ? 1 : -1));
  return { followups, source };
}

/** 读取跟进记录（新 → 旧排序）；传入 leadId 时只返回该询盘的记录。飞书不可用时回退 mock。30 分钟缓存。 */
export async function getFollowups(leadId?: string): Promise<Followup[]> {
  return (await getFollowupsWithSource(leadId)).followups;
}

/** 新增一条跟进记录，并把询盘的「最后跟进」刷成当前时间。mock 模式下不持久化。 */
export async function addFollowup(input: AddFollowupInput): Promise<AddFollowupResult> {
  const now = new Date();
  const followup: Followup = {
    id: `local-${now.getTime()}`,
    leadId: input.leadId,
    at: now.toISOString(),
    channel: input.channel,
    content: input.content,
    ...(input.nextAction ? { nextAction: input.nextAction } : {}),
    ...(input.nextFollowAt ? { nextFollowAt: input.nextFollowAt } : {})
  };

  if (!hasFeishuEnv()) {
    await syncCalendarReminder(input);
    return { followup, source: 'mock' };
  }

  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();

  const fields: Record<string, unknown> = {
    关联询盘: [input.leadId],
    时间: now.getTime(),
    通道: input.channel,
    内容: input.content
  };
  if (input.nextAction) fields['下次动作'] = input.nextAction;
  if (input.nextFollowAt) {
    const parsed = new Date(input.nextFollowAt);
    if (!Number.isNaN(parsed.getTime())) fields['下次跟进'] = parsed.getTime();
  }

  const res = await fetch(BITABLE_RECORDS_URL(cfg.bitableAppToken, followupsTableId()), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`feishu add followup HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    data?: { record?: { record_id?: string } };
  };
  if (data.code !== 0) {
    throw new Error(`feishu add followup failed: ${data.msg ?? data.code}`);
  }
  followup.id = data.data?.record?.record_id ?? followup.id;

  // 刷新询盘「最后跟进」日期；leads 表缺该字段时 fail soft，不影响跟进记录本身。
  try {
    await updateLeadLastFollow(input.leadId, followup.at);
  } catch (error) {
    console.warn('[followups] update lead 最后跟进 failed (ignored):', error);
  }

  await syncCalendarReminder(input);

  return { followup, source: 'feishu' };
}

/**
 * 有「下次跟进」日期时，尽力在飞书日历创建一条跟进日程（fail-soft，绝不抛异常）。
 * 自动同步可用 FEISHU_CALENDAR_AUTOSYNC=off 关闭；详情页手动「同步到飞书日历」不受影响。
 */
async function syncCalendarReminder(input: AddFollowupInput): Promise<void> {
  if (!input.nextFollowAt) return;
  const result = await scheduleFollowupReminder(input.leadId, input.nextFollowAt, {
    leadLabel: input.leadLabel,
    notes: input.nextAction ?? input.content
  });
  if (!result.synced) {
    console.warn('[followups] calendar sync skipped:', result.reason);
  }
}

// ---------- 待跟进任务推导 ----------

/**
 * 推导全部待跟进任务（按 dueAt 升序）：
 * 1. 约定跟进：最新一条带「下次跟进」日期的跟进记录 → 到期任务（含未来日期）。
 * 2. 僵住唤醒：状态在 新询盘/已联系/待跟进，且最近触达（跟进时间 / 最后跟进 / 创建时间）
 *    距今 ≥ FOLLOWUP_STALE_DAYS 天 → 生成任务，dueAt = 最近触达 + N 天。
 * 已成交 / 已流失的询盘不生成任务；有约定跟进的询盘不再重复生成僵住任务。
 */
export async function getFollowupTasks(): Promise<FollowupTasksResponse> {
  const [{ leads, source: leadsSource }, { followups, source: followupsSource }] =
    await Promise.all([getLeads(), getFollowupsWithSource()]);
  // 任务是 leads + followups 两源推导的：任一源回退 mock，任务计数就不可信。
  // 合并判定（任一 mock → mock），否则 followups 表挂了而 leads 正常时，
  // 周报 / 通知铃铛会把假待办数当真数据推给运营。
  const source = mergeSources(leadsSource, followupsSource);

  const byLead = new Map<string, Followup[]>();
  for (const followup of followups) {
    const list = byLead.get(followup.leadId);
    if (list) list.push(followup);
    else byLead.set(followup.leadId, [followup]);
  }

  const now = Date.now();
  const tasks: FollowupTask[] = [];

  for (const lead of leads) {
    if (CLOSED_STATUSES.includes(lead.status)) continue;

    // getFollowups 已按新 → 旧排序
    const list = byLead.get(lead.id) ?? [];
    const last = list[0];
    const lastChannel = last?.channel;

    // 1. 约定跟进：取最新一条带 nextFollowAt 的记录
    const scheduled = list.find((item) => item.nextFollowAt);
    if (scheduled?.nextFollowAt) {
      tasks.push({
        leadId: lead.id,
        company: lead.company,
        email: lead.email,
        site: lead.site,
        country: lead.country,
        dueAt: scheduled.nextFollowAt,
        reason: scheduled.nextAction ?? '约定跟进',
        kind: 'scheduled',
        ...(lastChannel ? { lastChannel } : {})
      });
      continue;
    }

    // 2. 僵住唤醒
    if (!STALE_STATUSES.includes(lead.status)) continue;
    const touchCandidates = [last?.at, lead.lastFollowAt].filter((value): value is string =>
      Boolean(value)
    );
    const lastTouch =
      touchCandidates.length > 0
        ? touchCandidates.reduce((a, b) => (a > b ? a : b))
        : lead.createdAt;
    const lastTouchMs = new Date(lastTouch).getTime();
    if (Number.isNaN(lastTouchMs)) continue;
    if (now - lastTouchMs < FOLLOWUP_STALE_DAYS * DAY_MS) continue;

    tasks.push({
      leadId: lead.id,
      company: lead.company,
      email: lead.email,
      site: lead.site,
      country: lead.country,
      dueAt: new Date(lastTouchMs + FOLLOWUP_STALE_DAYS * DAY_MS).toISOString(),
      reason: `${FOLLOWUP_STALE_DAYS} 天未跟进`,
      kind: 'stale',
      ...(lastChannel ? { lastChannel } : {})
    });
  }

  tasks.sort((a, b) => (a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : 0));
  return { tasks, source };
}

/** 按上海时区的自然日把任务分成 已逾期 / 今日待办 / 未来跟进。 */
export function getTaskUrgency(dueAt: string, now: Date = new Date()): TaskUrgency {
  const dueDay = shanghaiDay(new Date(dueAt));
  const today = shanghaiDay(now);
  if (dueDay < today) return 'overdue';
  if (dueDay > today) return 'upcoming';
  return 'today';
}

/** 取某个时刻在上海时区的 YYYY-MM-DD（用于自然日比较）。 */
function shanghaiDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

// ---------- 内置 mock 数据 ----------

const MOCK_FOLLOWUPS: Followup[] = [
  {
    id: 'recFuMock001',
    leadId: 'recMock001',
    at: '2026-08-17T10:30:00.000Z',
    channel: 'whatsapp',
    content: '已发产品目录与价目表，客户说斋月备货量可能翻倍',
    nextAction: '确认最终量级后寄样',
    nextFollowAt: '2026-08-20T01:00:00.000Z'
  },
  {
    id: 'recFuMock002',
    leadId: 'recMock003',
    at: '2026-08-13T09:12:00.000Z',
    channel: 'email',
    content: '首封报价邮件已发送（TPD 合规系列），等待客户反馈',
    nextFollowAt: '2026-08-18T01:00:00.000Z'
  },
  {
    id: 'recFuMock003',
    leadId: 'recMock008',
    at: '2026-08-15T13:40:00.000Z',
    channel: 'call',
    content: '电话沟通 20 分钟，客户对 HAYATI 系列兴趣很大，月量可能上调',
    nextAction: '发 HAYATI 报价单',
    nextFollowAt: '2026-08-19T01:00:00.000Z'
  },
  {
    id: 'recFuMock004',
    leadId: 'recMock002',
    at: '2026-08-16T15:05:00.000Z',
    channel: 'note',
    content: '客户要求沙特本地仓发货，需先确认物流方案再报价'
  },
  {
    id: 'recFuMock005',
    leadId: 'recMock004',
    at: '2026-08-11T08:20:00.000Z',
    channel: 'email',
    content: 'DDP 报价已发，等客户财务确认',
    nextAction: '跟进付款水单',
    nextFollowAt: '2026-08-14T01:00:00.000Z'
  }
];
