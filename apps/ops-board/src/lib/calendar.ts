import { getTenantAccessToken } from '@/lib/feishu-base';

/**
 * 飞书日历同步（仅服务端，全程 fail-soft）。
 *
 * 场景：运营给询盘设置「下次跟进日期」后，自动/手动在飞书日历上创建一条日程，
 * 让运营在飞书里收到日历提醒。
 *
 * 依赖（缺一即静默跳过，绝不影响跟进主流程）：
 *  1. FEISHU_APP_ID / FEISHU_APP_SECRET（tenant_access_token）
 *  2. 飞书应用后台开启「日历」权限 scope：`calendar:calendar`
 *     （或细粒度 `calendar:calendar.event:create`；查询日历列表另需 `calendar:calendar:readonly`）
 *  3. 目标日历：环境变量 FEISHU_CALENDAR_ID 指定；
 *     未指定时列出应用机器人可见的日历，挑一个 role=owner/writer 的（优先 primary）。
 *     注意：tenant token 只能看到机器人有权限的日历——想让日程出现在运营的日历上，
 *     需建一个共享日历并把机器人加为「可编辑」成员、运营加为订阅者。
 *  4. 写回同步状态需要 Bitable leads 表有「下次跟进日期」(日期) 和「日历事件ID」(文本) 两列。
 *
 * 环境变量：
 *  - FEISHU_CALENDAR_ID        目标日历 ID（推荐：共享日历）
 *  - FEISHU_CALENDAR_TIMEZONE  日程时区，默认 Asia/Shanghai
 *  - FEISHU_CALENDAR_AUTOSYNC  设为 'off' 时关闭自动同步（手动「同步到飞书日历」按钮仍可用）
 */

const CALENDAR_API = 'https://open.feishu.cn/open-apis/calendar/v4';
const DEFAULT_TIMEZONE = 'Asia/Shanghai';
const EVENT_DURATION_MINUTES = 30;

/** Bitable leads 表上的日历同步字段名。 */
const FIELD_NEXT_FOLLOW_AT = '下次跟进日期';
const FIELD_CALENDAR_EVENT_ID = '日历事件ID';

export interface CalendarSyncResult {
  /** 是否成功创建了日历日程（或已经同步过）。 */
  synced: boolean;
  /** 飞书日程 event_id（synced=true 时存在）。 */
  eventId?: string;
  calendarId?: string;
  /** 同步状态是否成功写回 Bitable（写回失败不影响日程本身）。 */
  persisted?: boolean;
  /** true 表示该跟进此前已同步，本次未重复创建。 */
  alreadySynced?: boolean;
  /** synced=false 时的原因（供 UI/日志展示）。 */
  reason?: string;
}

export interface LeadFollowupSchedule {
  /** 「下次跟进日期」字段值（ISO 字符串），无则 null。 */
  nextFollowAt: string | null;
  /** 「日历事件ID」字段值，无则 null。 */
  calendarEventId: string | null;
}

function calendarTimezone(): string {
  return process.env.FEISHU_CALENDAR_TIMEZONE?.trim() || DEFAULT_TIMEZONE;
}

function hasAppCredentials(): boolean {
  return Boolean(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET);
}

function hasBitableEnv(): boolean {
  return Boolean(process.env.FEISHU_BITABLE_APP_TOKEN && process.env.FEISHU_LEADS_TABLE_ID);
}

const BITABLE_RECORD_URL = (recordId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${process.env.FEISHU_BITABLE_APP_TOKEN}/tables/${process.env.FEISHU_LEADS_TABLE_ID}/records/${recordId}`;

// ---------- 日历解析 ----------

interface CalendarItem {
  calendar_id?: string;
  summary?: string;
  type?: string; // primary | shared | resource | ...
  role?: string; // owner | writer | reader | free_busy_reader
}

/**
 * 确定目标日历 ID：FEISHU_CALENDAR_ID 优先；
 * 否则列出机器人可见日历，挑 role=owner/writer 且 type=primary/shared 的（primary 优先）。
 * 找不到返回 null。
 */
async function resolveCalendarId(token: string): Promise<string | null> {
  const fromEnv = process.env.FEISHU_CALENDAR_ID?.trim();
  if (fromEnv) return fromEnv;

  const res = await fetch(`${CALENDAR_API}/calendars?page_size=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`feishu list calendars HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    data?: { calendar_list?: CalendarItem[] };
  };
  if (data.code !== 0) {
    throw new Error(`feishu list calendars failed: ${data.msg ?? data.code}`);
  }
  const writable = (data.data?.calendar_list ?? []).filter(
    (item) =>
      item.calendar_id &&
      (item.role === 'owner' || item.role === 'writer') &&
      (item.type === 'primary' || item.type === 'shared')
  );
  const primary = writable.find((item) => item.type === 'primary');
  return (primary ?? writable[0])?.calendar_id ?? null;
}

// ---------- 创建日程 ----------

export interface CreateFollowupEventInput {
  /** 日程标题（summary），如「跟进询盘：Al Mezwan Trading LLC」。 */
  title: string;
  /** 询盘 Bitable record_id（仅用于描述字段）。 */
  leadId: string;
  /** 下次跟进时间（ISO 字符串或可被 Date 解析的格式）。 */
  dueAt: string;
  notes?: string;
  /** 日程时长（分钟），默认 30。 */
  durationMinutes?: number;
}

/**
 * 在目标日历上创建一条跟进日程。永不抛异常：
 * 环境缺失 / scope 未开 / 日历不可写 → 返回 { synced:false, reason }。
 */
export async function createFollowupEvent(
  input: CreateFollowupEventInput
): Promise<CalendarSyncResult> {
  try {
    if (!hasAppCredentials()) {
      return { synced: false, reason: '未配置 FEISHU_APP_ID/FEISHU_APP_SECRET' };
    }
    const start = new Date(input.dueAt);
    if (Number.isNaN(start.getTime())) {
      return { synced: false, reason: `无效的跟进时间: ${input.dueAt}` };
    }
    const durationMs = (input.durationMinutes ?? EVENT_DURATION_MINUTES) * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);
    const timezone = calendarTimezone();

    const token = await getTenantAccessToken();
    const calendarId = await resolveCalendarId(token);
    if (!calendarId) {
      return {
        synced: false,
        reason: '未找到可写日历：请配置 FEISHU_CALENDAR_ID，或把应用机器人加为某个日历的可编辑成员'
      };
    }

    const descriptionLines = [
      `询盘 ID：${input.leadId}`,
      `后台详情：/dashboard/leads/${input.leadId}`
    ];
    if (input.notes) descriptionLines.push(`备注：${input.notes}`);

    const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        summary: input.title.slice(0, 1000),
        description: descriptionLines.join('\n'),
        start_time: {
          timestamp: String(Math.floor(start.getTime() / 1000)),
          timezone
        },
        end_time: {
          timestamp: String(Math.floor(end.getTime() / 1000)),
          timezone
        }
      })
    });
    if (!res.ok) throw new Error(`feishu create event HTTP ${res.status}`);
    const data = (await res.json()) as {
      code: number;
      msg?: string;
      data?: { event?: { event_id?: string } };
    };
    if (data.code !== 0 || !data.data?.event?.event_id) {
      // 常见：99991663=无权限（scope 未开）、190007=应用未启用机器人能力
      throw new Error(`feishu create event failed: ${data.msg ?? data.code}`);
    }
    return { synced: true, eventId: data.data.event.event_id, calendarId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn('[calendar] createFollowupEvent skipped:', reason);
    return { synced: false, reason };
  }
}

// ---------- Bitable 同步状态读写 ----------

/** Bitable 日期字段读出来是毫秒时间戳；兼容文本。 */
function parseBitableDate(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
}

function parseBitableText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    const text = value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          return typeof record.text === 'string' ? record.text : '';
        }
        return '';
      })
      .join('')
      .trim();
    return text || null;
  }
  return null;
}

/** 读取询盘的「下次跟进日期 / 日历事件ID」；飞书未配置或读取失败时返回全 null。 */
export async function getLeadFollowupSchedule(recordId: string): Promise<LeadFollowupSchedule> {
  const empty: LeadFollowupSchedule = { nextFollowAt: null, calendarEventId: null };
  if (!hasAppCredentials() || !hasBitableEnv()) return empty;
  try {
    const token = await getTenantAccessToken();
    const res = await fetch(BITABLE_RECORD_URL(recordId), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`feishu get record HTTP ${res.status}`);
    const data = (await res.json()) as {
      code: number;
      msg?: string;
      data?: { record?: { fields?: Record<string, unknown> } };
    };
    if (data.code !== 0) throw new Error(`feishu get record failed: ${data.msg ?? data.code}`);
    const fields = data.data?.record?.fields ?? {};
    return {
      nextFollowAt: parseBitableDate(fields[FIELD_NEXT_FOLLOW_AT]),
      calendarEventId: parseBitableText(fields[FIELD_CALENDAR_EVENT_ID])
    };
  } catch (error) {
    console.warn('[calendar] getLeadFollowupSchedule failed:', error);
    return empty;
  }
}

/** 把「下次跟进日期 + 日历事件ID」写回询盘记录；失败返回 false（不抛异常）。 */
async function markLeadFollowupSynced(
  recordId: string,
  dueAt: Date,
  eventId: string
): Promise<boolean> {
  if (!hasAppCredentials() || !hasBitableEnv()) return false;
  try {
    const token = await getTenantAccessToken();
    const res = await fetch(BITABLE_RECORD_URL(recordId), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        fields: {
          [FIELD_NEXT_FOLLOW_AT]: dueAt.getTime(),
          [FIELD_CALENDAR_EVENT_ID]: eventId
        }
      })
    });
    if (!res.ok) throw new Error(`feishu update record HTTP ${res.status}`);
    const data = (await res.json()) as { code: number; msg?: string };
    if (data.code !== 0) throw new Error(`feishu update record failed: ${data.msg ?? data.code}`);
    return true;
  } catch (error) {
    console.warn('[calendar] markLeadFollowupSynced failed:', error);
    return false;
  }
}

// ---------- 对跟进功能的统一入口 ----------

export interface ScheduleFollowupReminderOptions {
  /** 日程标题；默认「跟进询盘：<leadLabel ?? leadId>」。 */
  title?: string;
  /** 公司名或邮箱，用于默认标题。 */
  leadLabel?: string;
  notes?: string;
  /** 手动同步时传 true，绕过 FEISHU_CALENDAR_AUTOSYNC=off。 */
  force?: boolean;
}

/**
 * 跟进任务创建后的统一钩子（fail-soft，绝不抛异常）：
 * 创建日历日程 + 把 event_id / 下次跟进日期写回询盘记录。
 * 同一询盘同一时间已同步过则直接返回 alreadySynced，不重复创建。
 *
 * 接线方式：在 `addFollowup`（src/lib/followups.ts）或
 * `POST /api/leads/[id]/followups` 路由里，当 followup 带 nextFollowAt 时：
 * ```ts
 * await scheduleFollowupReminder(leadId, followup.nextFollowAt, { leadLabel, notes });
 * ```
 */
export async function scheduleFollowupReminder(
  leadId: string,
  dueAt: string,
  options?: ScheduleFollowupReminderOptions
): Promise<CalendarSyncResult> {
  if (!options?.force && process.env.FEISHU_CALENDAR_AUTOSYNC?.trim().toLowerCase() === 'off') {
    return { synced: false, reason: '自动同步已关闭（FEISHU_CALENDAR_AUTOSYNC=off）' };
  }
  const start = new Date(dueAt);
  if (Number.isNaN(start.getTime())) {
    return { synced: false, reason: `无效的跟进时间: ${dueAt}` };
  }

  // 去重：同一询盘、同一时间（分钟级）已同步过就不再重复建日程
  const current = await getLeadFollowupSchedule(leadId);
  if (current.calendarEventId && current.nextFollowAt) {
    const existing = new Date(current.nextFollowAt);
    if (Math.abs(existing.getTime() - start.getTime()) < 60 * 1000) {
      return {
        synced: true,
        eventId: current.calendarEventId,
        persisted: true,
        alreadySynced: true
      };
    }
  }

  const result = await createFollowupEvent({
    title: options?.title ?? `跟进询盘：${options?.leadLabel ?? leadId}`,
    leadId,
    dueAt: start.toISOString(),
    notes: options?.notes
  });
  if (!result.synced || !result.eventId) return result;

  const persisted = await markLeadFollowupSynced(leadId, start, result.eventId);
  return { ...result, persisted };
}
