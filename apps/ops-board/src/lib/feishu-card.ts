/**
 * 飞书卡片回调（card.action.trigger）支撑库 —— 自包含、可单测。
 *
 * 只依赖 ./feishu-base（相对路径，无 @/ 别名），node --test 可直接 import。
 * 路由层 src/app/api/feishu/card/route.ts 负责装配真实依赖（leads/followups/audit）。
 *
 * 关键机制（实证见 docs/superpowers/research/2026-08-27-feishu-bot-research.md）：
 *  - 验签：SHA256(timestamp + nonce + EncryptKey + 原始 body) 的 hex 与
 *    X-Lark-Signature 头比对；必须用原始字节，不能反序列化后再算。
 *  - 3 秒硬超时：路由立即 200 ACK + toast，本库的写回编排走异步。
 *  - event.token 30 分钟/最多 2 次：延时更新卡片一律用 PATCH 消息 API
 *    （依赖 context.open_message_id），不依赖 event.token。
 *  - 幂等：飞书超时会重推；双保险 = 进程内指纹去重 + 「状态已是目标值则跳过」。
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  buildNewLeadCard,
  getTenantAccessToken,
  readFeishuConfig,
  type LeadPayload,
  type SiteKey
} from './feishu-base.ts';

// ---------- 动作定义 ----------

export const LEAD_CARD_OPS = ['followed_up', 'won', 'invalid'] as const;

export type LeadCardOp = (typeof LEAD_CARD_OPS)[number];

/** 按钮文案（用户可见，中文）。 */
export const LEAD_CARD_OP_LABELS: Record<LeadCardOp, string> = {
  followed_up: '已跟进',
  won: '成交',
  invalid: '无效'
};

/**
 * 动作 → leads 表「状态」字段目标值（对应既有 7 态：
 * 新询盘 / 已联系 / 已报价 / 样品单 / 成交 / 流失 / 待跟进）。
 * 「已跟进」落到漏斗第二列「已联系」；「无效」落到「流失」。
 */
export const LEAD_CARD_OP_TARGET_STATUS: Record<LeadCardOp, string> = {
  followed_up: '已联系',
  won: '成交',
  invalid: '流失'
};

export function isLeadCardOp(value: unknown): value is LeadCardOp {
  return typeof value === 'string' && (LEAD_CARD_OPS as readonly string[]).includes(value);
}

// ---------- 验签 ----------

/** 防重放时间窗：回调时间戳与本地时钟差超过该值即拒绝。 */
export const SIGNATURE_MAX_SKEW_SECONDS = 300;

/** 官方算法：SHA256(timestamp + nonce + encryptKey + 原始 body) → hex。 */
export function computeCardSignature(
  timestamp: string,
  nonce: string,
  encryptKey: string,
  rawBody: string
): string {
  return createHash('sha256')
    .update(timestamp + nonce + encryptKey + rawBody, 'utf8')
    .digest('hex');
}

/** 恒时比较两个 hex 签名（长度不等直接 false，防时序侧信道）。 */
function hexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface VerifySignatureInput {
  timestamp: string | null;
  nonce: string | null;
  signature: string | null;
  encryptKey: string;
  rawBody: string;
  /** 当前时刻（秒），测试可注入；默认取系统时间。 */
  nowSeconds?: number;
}

/** 验签 + 时间戳防重放。任一头缺失 / 时间戳超窗 / 签名不符 → false。 */
export function verifyCardSignature(input: VerifySignatureInput): boolean {
  const { timestamp, nonce, signature, encryptKey, rawBody } = input;
  if (!timestamp || !nonce || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > SIGNATURE_MAX_SKEW_SECONDS) return false;
  const expected = computeCardSignature(timestamp, nonce, encryptKey, rawBody);
  return hexEqual(expected, signature.toLowerCase());
}

// ---------- 回调体解析 ----------

export interface ParsedCardAction {
  kind: 'action';
  op: LeadCardOp;
  /** leads 表 record_id */
  recordId: string;
  /** 点按钮的人 */
  operatorOpenId: string;
  /** 原卡片 message_id（PATCH 更新用），可能缺失 */
  messageId?: string;
  /** 卡片所在群 chat_id（失败回报用），可能缺失 */
  chatId?: string;
}

export interface ParsedChallenge {
  kind: 'challenge';
  challenge: string;
  /** url_verification 里的 Verification Token（可选二次校验） */
  token?: string;
}

export type ParsedCardCallback = ParsedCardAction | ParsedChallenge | { kind: 'unknown' };

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * 解析回调体。支持：
 *  - url_verification（配回调地址时的 challenge 握手）
 *  - 卡片按钮回调（operator.open_id + action.value.{op, record_id} + context）
 * 其它一律 {kind:'unknown'}（调用方回 200 忽略，不触发重推）。
 */
export function parseCardCallback(body: unknown): ParsedCardCallback {
  if (!body || typeof body !== 'object') return { kind: 'unknown' };
  const obj = body as Record<string, unknown>;

  // URL 配置握手：原样回显 challenge 是硬性要求，优先处理。
  if (obj.type === 'url_verification') {
    const challenge = asString(obj.challenge);
    if (!challenge) return { kind: 'unknown' };
    const token = asString(obj.token);
    return token ? { kind: 'challenge', challenge, token } : { kind: 'challenge', challenge };
  }

  // 卡片按钮回调（card.action.trigger）
  const action = obj.action as Record<string, unknown> | undefined;
  const value = action?.value as Record<string, unknown> | undefined;
  const op = value?.op;
  const recordId = asString(value?.record_id);
  if (!isLeadCardOp(op) || !recordId) return { kind: 'unknown' };

  const operator = obj.operator as Record<string, unknown> | undefined;
  const operatorOpenId = asString(operator?.open_id) ?? asString(obj.open_id);
  if (!operatorOpenId) return { kind: 'unknown' };

  const context = obj.context as Record<string, unknown> | undefined;
  const messageId = asString(context?.open_message_id) ?? asString(obj.open_message_id);
  const chatId = asString(context?.open_chat_id) ?? asString(obj.open_chat_id);

  return {
    kind: 'action',
    op,
    recordId,
    operatorOpenId,
    ...(messageId ? { messageId } : {}),
    ...(chatId ? { chatId } : {})
  };
}

// ---------- 操作者白名单（复用 rbac.ts 的 ADMIN_OPEN_IDS 思路） ----------

/** 回调里没有 session，直接拿 open_id 比对 ADMIN_OPEN_IDS。 */
export function isCardOperatorAllowed(
  openId: string,
  adminOpenIdsEnv: string | undefined = process.env.ADMIN_OPEN_IDS
): boolean {
  const list = (adminOpenIdsEnv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // 与 rbac.ts 一致 fail soft：未配置名单时不锁死（看板同理）。
  if (list.length === 0) return true;
  return list.includes(openId);
}

/** 卡片上的操作者显示名：管理员统一脱敏为「Admin」（与 rbac.ts 一致）。 */
export function cardOperatorDisplayName(
  openId: string,
  adminOpenIdsEnv: string | undefined = process.env.ADMIN_OPEN_IDS
): string {
  const list = (adminOpenIdsEnv ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(openId) ? 'Admin' : '运营';
}

// ---------- 幂等 ----------

/** 状态机判定：已是目标状态 → 'already'（跳过写入），否则 'apply'。 */
export function decideWriteback(currentStatus: string, targetStatus: string): 'apply' | 'already' {
  return currentStatus.trim() === targetStatus ? 'already' : 'apply';
}

/** 进程内动作指纹去重（TTL 10 分钟）。跨实例的兜底靠 decideWriteback。 */
const recentFingerprints = new Map<string, number>();
const FINGERPRINT_TTL_MS = 10 * 60 * 1000;

/**
 * 标记一个动作指纹；已见过（未过期）→ false（调用方应跳过重处理）。
 * key = messageId:recordId:op —— 同一卡片同一按钮的重推指纹相同。
 */
export function markFingerprintIfNew(key: string, nowMs: number = Date.now()): boolean {
  // 顺带清过期项，防止 Map 无限增长
  for (const [k, at] of recentFingerprints) {
    if (nowMs - at > FINGERPRINT_TTL_MS) recentFingerprints.delete(k);
  }
  const seen = recentFingerprints.get(key);
  if (seen !== undefined && nowMs - seen <= FINGERPRINT_TTL_MS) return false;
  recentFingerprints.set(key, nowMs);
  return true;
}

/** Reset dedupe state — exported for tests only. */
export function _resetFingerprintsForTest(): void {
  recentFingerprints.clear();
}

// ---------- 结果卡片 ----------

/** 上海时区 HH:mm（卡片 note 用）。 */
export function shanghaiTime(now: Date = new Date()): string {
  return now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * 动作完成后的结果卡：复用新询盘卡布局，但三按钮区换成一行 note
 * （「✅ 已由 {操作人} 标记为「已跟进」 · 时间」），URL 按钮（WhatsApp/邮件）保留。
 */
export function buildLeadResultCard(
  payload: LeadPayload,
  recordId: string,
  note: string
): Record<string, unknown> {
  return buildNewLeadCard(payload, recordId, { statusNote: note });
}

// ---------- 飞书 OpenAPI 读写（fetch 直发，沿用 feishu-base 风格） ----------

const BITABLE_ENDPOINT = (appToken: string, tableId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

/** Bitable 文本字段可能是 string / [{type:'text',text}] / {text,link} / number。 */
function fieldText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((item) => fieldText(item)).join('');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.link === 'string') return record.link;
  }
  return '';
}

function fieldTextArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    const single = fieldText(value).trim();
    return single ? [single] : undefined;
  }
  const items = value.map((item) => fieldText(item).trim()).filter((item) => item.length > 0);
  return items.length ? items : undefined;
}

const SITE_KEYS_READONLY: readonly string[] = ['dubai', 'gulf', 'europe', 'vapegogogo'];

export interface LeadRecordSnapshot {
  recordId: string;
  status: string;
  /** 重建结果卡所需的询盘内容（从 Bitable 字段回读，已转义前原样）。 */
  payload: LeadPayload;
}

/** 读单条询盘（GET records/:id）；记录不存在或飞书故障时返回 null。 */
export async function readLeadRecord(recordId: string): Promise<LeadRecordSnapshot | null> {
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();
  const res = await fetch(
    `${BITABLE_ENDPOINT(cfg.bitableAppToken, cfg.leadsTableId)}/${recordId}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`feishu read lead HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    data?: { record?: { record_id?: string; fields?: Record<string, unknown> } };
  };
  if (data.code !== 0) throw new Error(`feishu read lead failed: ${data.msg ?? data.code}`);
  const record = data.data?.record;
  if (!record?.record_id || !record.fields) return null;

  const fields = record.fields;
  const siteText = fieldText(fields['来源站']).trim().toLowerCase();
  const siteKey = (SITE_KEYS_READONLY.includes(siteText) ? siteText : 'europe') as SiteKey;
  const payload: LeadPayload = {
    siteKey,
    type: fieldText(fields['类型']).trim() === 'newsletter' ? 'newsletter' : 'wholesale',
    email: fieldText(fields['邮箱']).trim()
  };
  const company = fieldText(fields['公司']).trim();
  if (company) payload.company = company;
  const country = fieldText(fields['国家']).trim();
  if (country) payload.country = country;
  const phone = fieldText(fields['电话']).trim();
  if (phone) payload.phone = phone;
  const brands = fieldTextArray(fields['意向品牌']);
  if (brands) payload.brands = brands;
  const volume = fieldText(fields['采购量级']).trim();
  if (volume) payload.volume = volume;
  const notes = fieldText(fields['备注']).trim();
  if (notes) payload.notes = notes;

  return { recordId: record.record_id, status: fieldText(fields['状态']).trim(), payload };
}

/**
 * PATCH 更新原卡片（延时更新走消息 API，不用短命的 event.token）。
 * 需自建应用具备 im:message 权限。
 */
export async function patchCardMessage(
  messageId: string,
  card: Record<string, unknown>
): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(
    `https://open.feishu.cn/open-apis/im/v1/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ msg_type: 'interactive', content: JSON.stringify(card) })
    }
  );
  if (!res.ok) throw new Error(`feishu patch message HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) throw new Error(`feishu patch message failed: ${data.msg ?? data.code}`);
}

/** 往群里补一条纯文本（异步处理失败时不能让运营无感知）。 */
export async function sendChatText(chatId: string, text: string): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(
    'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: 'text',
        content: JSON.stringify({ text })
      })
    }
  );
  if (!res.ok) throw new Error(`feishu send text HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) throw new Error(`feishu send text failed: ${data.msg ?? data.code}`);
}

// ---------- 写回编排（依赖注入，单测可 mock） ----------

export interface CardActionDeps {
  /** 读当前状态（decideWriteback 幂等判定用）与卡片内容。 */
  readLead(recordId: string): Promise<LeadRecordSnapshot | null>;
  /** 写 leads 表「状态」字段。 */
  writeStatus(recordId: string, status: string): Promise<void>;
  /** 追加一条跟进日志（channel=note）。 */
  addFollowupLog(recordId: string, content: string): Promise<void>;
  /** PATCH 原卡片。 */
  patchCard(messageId: string, card: Record<string, unknown>): Promise<void>;
  /** 失败时在群里补一条中文错误（chatId 缺失时也应尽力 console.error）。 */
  reportError(chatId: string | undefined, text: string): Promise<void>;
  /** 审计（可选，fail-soft）。 */
  audit?(recordId: string, op: LeadCardOp, target: string, operatorName: string): Promise<void>;
  now?: Date;
}

export type CardActionResult = 'applied' | 'skipped' | 'not_found' | 'error';

/**
 * 按钮写回主流程（在路由 ACK 之后异步执行）：
 *   读记录 → 幂等判定 → 写状态 + 跟进日志 + 审计 → PATCH 原卡片。
 * 任何失败都经 reportError 中文回报，绝不静默。
 */
export async function runLeadCardAction(
  action: ParsedCardAction,
  deps: CardActionDeps
): Promise<CardActionResult> {
  const opLabel = LEAD_CARD_OP_LABELS[action.op];
  const target = LEAD_CARD_OP_TARGET_STATUS[action.op];
  const operatorName = cardOperatorDisplayName(action.operatorOpenId);
  const when = shanghaiTime(deps.now ?? new Date());

  try {
    const snapshot = await deps.readLead(action.recordId);
    if (!snapshot) {
      await deps.reportError(
        action.chatId,
        `❌ 飞书卡片操作失败：找不到询盘记录 ${action.recordId}，可能已被删除。`
      );
      return 'not_found';
    }

    const decision = decideWriteback(snapshot.status, target);
    if (decision === 'apply') {
      await deps.writeStatus(action.recordId, target);
      await deps.addFollowupLog(
        action.recordId,
        `飞书卡片标记为「${opLabel}」（状态 → ${target}）`
      );
      if (deps.audit) await deps.audit(action.recordId, action.op, target, operatorName);
    }

    if (action.messageId) {
      const note =
        decision === 'apply'
          ? `✅ 已由 ${operatorName} 标记为「${opLabel}」 · ${when}`
          : `ℹ️ 状态已是「${snapshot.status}」，本次点击未重复写入 · ${when}`;
      await deps.patchCard(
        action.messageId,
        buildLeadResultCard(snapshot.payload, action.recordId, note)
      );
    }
    return decision === 'apply' ? 'applied' : 'skipped';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('[feishu-card] action failed:', message);
    try {
      await deps.reportError(
        action.chatId,
        `❌ 飞书卡片「${opLabel}」回写失败（记录 ${action.recordId}）：${message}。请到后台手动改状态。`
      );
    } catch (reportError) {
      console.error(
        '[feishu-card] error report failed:',
        reportError instanceof Error ? reportError.message : 'unknown'
      );
    }
    return 'error';
  }
}
