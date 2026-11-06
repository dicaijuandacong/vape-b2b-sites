/**
 * Feishu (Lark) integration for lead ingestion.
 *
 * Self-contained on purpose (no @/lib imports) so the same file can be
 * copied byte-identical across all four sites and unit-tested without
 * path-alias resolution.
 *
 * Responsibilities:
 *  - read Feishu env config
 *  - tenant_access_token acquisition with in-memory cache
 *  - appendLead: create a record in the Bitable `leads` table
 *  - notifyNewLead: push an interactive card to the ops group bot
 */
export type SiteKey = "dubai" | "gulf" | "europe" | "vapegogogo";

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  bitableAppToken: string;
  leadsTableId: string;
  botWebhook: string;
}

export interface LeadPayload {
  siteKey: SiteKey;
  type: "wholesale" | "newsletter";
  email: string;
  company?: string;
  country?: string;
  phone?: string;
  brands?: string[];
  volume?: string;
  notes?: string;
  ip?: string | null;
  ua?: string | null;
}

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_ENDPOINT = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

let tokenCache: { value: string; expiresAt: number } | null = null;

/** Reset token cache — exported for tests only. */
export function _resetTokenCacheForTest(): void {
  tokenCache = null;
}

export function readFeishuConfig(): FeishuConfig {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const bitableAppToken = process.env.FEISHU_BITABLE_APP_TOKEN;
  const leadsTableId = process.env.FEISHU_LEADS_TABLE_ID;
  if (!appId || !appSecret || !bitableAppToken || !leadsTableId) {
    throw new Error(
      "feishu env missing: need FEISHU_APP_ID/APP_SECRET/BITABLE_APP_TOKEN/LEADS_TABLE_ID",
    );
  }
  return {
    appId,
    appSecret,
    bitableAppToken,
    leadsTableId,
    botWebhook: process.env.FEISHU_BOT_WEBHOOK ?? "",
  };
}

export async function getTenantAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - now > TOKEN_REFRESH_BUFFER_MS) {
    return tokenCache.value;
  }
  const cfg = readFeishuConfig();
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: cfg.appId, app_secret: cfg.appSecret }),
  });
  if (!res.ok) throw new Error(`feishu token HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    tenant_access_token?: string;
    expire?: number;
  };
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`feishu token failed: ${data.msg ?? data.code}`);
  }
  tokenCache = {
    value: data.tenant_access_token,
    expiresAt: now + (data.expire ?? 7200) * 1000,
  };
  return tokenCache.value;
}

/** Normalize a phone string to a https://wa.me/<digits> deep link, or null. */
export function toWhatsAppUrl(phone: string | undefined, text: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Map a lead to Bitable `leads` table fields (Chinese column names, per ops schema). */
export function mapLeadToFields(payload: LeadPayload): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    "来源站": payload.siteKey,
    "类型": payload.type,
    "邮箱": payload.email,
    "状态": "新询盘",
    "来源IP": payload.ip ?? "",
    "UA": payload.ua ?? "",
  };
  if (payload.company) fields["公司"] = payload.company;
  if (payload.country) fields["国家"] = payload.country;
  if (payload.phone) {
    fields["电话"] = payload.phone;
    const wa = toWhatsAppUrl(payload.phone, "");
    if (wa) fields["WhatsApp"] = { text: wa, link: wa };
  }
  if (payload.brands?.length) fields["意向品牌"] = payload.brands;
  if (payload.volume) fields["采购量级"] = payload.volume;
  if (payload.notes) fields["备注"] = payload.notes;
  return fields;
}

const BITABLE_ENDPOINT = (appToken: string, tableId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

/** Create one record in the Bitable `leads` table; returns its record_id. */
export async function appendLead(payload: LeadPayload): Promise<string> {
  const cfg = readFeishuConfig();
  const token = await getTenantAccessToken();
  const res = await fetch(BITABLE_ENDPOINT(cfg.bitableAppToken, cfg.leadsTableId), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ fields: mapLeadToFields(payload) }),
  });
  if (!res.ok) throw new Error(`feishu appendLead HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    data?: { record?: { record_id?: string } };
  };
  if (data.code !== 0) throw new Error(`feishu appendLead failed: ${data.msg ?? data.code}`);
  return data.data?.record?.record_id ?? "";
}

const SITE_LABELS: Record<SiteKey, string> = {
  dubai: "DubaiVape",
  gulf: "GulfVape",
  europe: "EuroVape",
  vapegogogo: "VapeGoGoGo",
};

/** Escape Lark-markdown metacharacters in untrusted (form-submitted) text. */
function escMd(s: string): string {
  return s.replace(/([*_~`])/g, "\\$1");
}

/** Build the interactive card pushed to the ops group bot for a new lead. */
export function buildNewLeadCard(
  payload: LeadPayload,
  recordId: string,
  options?: { statusActions?: boolean; statusNote?: string },
): Record<string, unknown> {
  const lines: string[] = [`**类型** ${payload.type === "wholesale" ? "B2B 询盘" : "邮件订阅"}`];
  if (payload.company) lines.push(`**公司** ${escMd(payload.company)}`);
  if (payload.country) lines.push(`**国家** ${escMd(payload.country)}`);
  lines.push(`**邮箱** ${escMd(payload.email)}`);
  if (payload.phone) lines.push(`**电话** ${escMd(payload.phone)}`);
  if (payload.brands?.length) lines.push(`**品牌** ${payload.brands.map(escMd).join(", ")}`);
  if (payload.volume) lines.push(`**量级** ${escMd(payload.volume)}`);
  if (payload.notes) lines.push(`**备注** ${escMd(payload.notes)}`);

  const actions: unknown[] = [];
  const wa = toWhatsAppUrl(
    payload.phone,
    `Hi ${SITE_LABELS[payload.siteKey]}, regarding your wholesale inquiry`,
  );
  if (wa) {
    actions.push({
      tag: "button",
      text: { tag: "plain_text", content: "💬 WhatsApp" },
      type: "primary",
      url: wa,
    });
  }
  actions.push({
    tag: "button",
    text: { tag: "plain_text", content: "✉️ 邮件" },
    type: "default",
    url: `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent("Wholesale inquiry - " + SITE_LABELS[payload.siteKey])}`,
  });

  const elements: unknown[] = [
    { tag: "div", text: { tag: "lark_md", content: lines.join("\n") } },
    { tag: "action", actions },
  ];

  // 状态回写按钮（飞书卡片回调 card.action.trigger，回调路由在 ops-v2 /api/feishu/card）。
  // value 是回调路由的唯一分发依据；behaviors 同步声明 callback 类型。
  // 注意：只有自建应用机器人发出的卡片才会触发回调（群自定义机器人 webhook
  // 发的卡片按钮收不到），notifyNewLead 据此选择推送路径。
  if (options?.statusNote) {
    elements.push({
      tag: "note",
      elements: [{ tag: "plain_text", content: options.statusNote }],
    });
  } else if (recordId && options?.statusActions !== false) {
    const mkValue = (op: string) => ({ op, record_id: recordId });
    elements.push({
      tag: "action",
      actions: [
        {
          tag: "button",
          text: { tag: "plain_text", content: "✅ 已跟进" },
          type: "primary",
          value: mkValue("followed_up"),
          behaviors: [{ type: "callback", value: mkValue("followed_up") }],
        },
        {
          tag: "button",
          text: { tag: "plain_text", content: "💰 成交" },
          type: "default",
          value: mkValue("won"),
          behaviors: [{ type: "callback", value: mkValue("won") }],
        },
        {
          tag: "button",
          text: { tag: "plain_text", content: "❌ 无效" },
          type: "danger",
          value: mkValue("invalid"),
          behaviors: [{ type: "callback", value: mkValue("invalid") }],
        },
      ],
    });
  }

  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: "plain_text", content: `🆕 新询盘 · ${SITE_LABELS[payload.siteKey]}` },
      template: payload.type === "wholesale" ? "green" : "turquoise",
    },
    elements,
  };
}

/**
 * Push the new-lead card to the ops group. Two paths:
 *  1. App bot message to FEISHU_NOTIFY_CHAT_ID (self-built app must be in that group)
 *  2. FEISHU_BOT_WEBHOOK (custom group bot) as fallback
 * 带状态按钮（recordId 非空且配了 FEISHU_NOTIFY_CHAT_ID）时优先走路径 1 ——
 * 群自定义机器人发的卡片按钮回调收不到（交互必须走自建应用）；webhook 仅作兜底。
 * No-op if neither is configured.
 */
export async function notifyNewLead(payload: LeadPayload, recordId: string): Promise<void> {
  const cfg = readFeishuConfig();
  const chatId = process.env.FEISHU_NOTIFY_CHAT_ID;
  const useAppBot = Boolean(chatId && recordId);
  const card = buildNewLeadCard(payload, recordId, useAppBot ? undefined : { statusActions: false });

  if (useAppBot && chatId) {
    const token = await getTenantAccessToken();
    const res = await fetch(
      "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receive_id: chatId,
          msg_type: "interactive",
          content: JSON.stringify(card),
        }),
      },
    );
    if (!res.ok) throw new Error(`feishu app-msg HTTP ${res.status}`);
    return;
  }

  if (cfg.botWebhook) {
    const res = await fetch(cfg.botWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg_type: "interactive", card }),
    });
    if (!res.ok) throw new Error(`feishu bot HTTP ${res.status}`);
    return;
  }

  // neither webhook nor chat configured — no-op
}
