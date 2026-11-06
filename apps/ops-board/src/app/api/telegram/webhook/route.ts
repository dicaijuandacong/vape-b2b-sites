import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Telegram Bot webhook：客户在 Telegram 上找我们 → 推卡片到飞书运营群。
 *
 * 安全与降级：
 *  - 校验 X-Telegram-Bot-Api-Secret-Token（BotFather setWebhook 时带的 secret_token），
 *    未配置 TELEGRAM_WEBHOOK_SECRET 时一律 403（默认关死，配了才开）。
 *  - 未配置 FEISHU_BOT_WEBHOOK / TELEGRAM_BOT_TOKEN 时对应动作静默跳过。
 *  - 无论内部处理成败都回 200，避免 Telegram 无限重试。
 *
 * 设置步骤见 docs/superpowers/plans/TELEGRAM-SETUP-CARD.md。
 */

export const dynamic = 'force-dynamic';

interface TgFrom {
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

interface TgMessage {
  message_id?: number;
  date?: number;
  chat?: { id?: number };
  from?: TgFrom;
  text?: string;
  contact?: { phone_number?: string; first_name?: string };
}

interface TgUpdate {
  update_id?: number;
  message?: TgMessage;
}

/** lark_md 转义 —— 用户输入不可信，防止卡片语法注入（逐字符转义，不搞反向引用）。 */
function escMd(s: string): string {
  return s.replace(/[[\]*_~`|()\\]/g, '\\$1').replace(/\r?\n/g, ' ');
}

/** 恒时比较，防时序侧信道猜 secret。 */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

function displayName(from?: TgFrom): string {
  const name = [from?.first_name, from?.last_name].filter(Boolean).join(' ');
  return name || '未提供';
}

async function sendFeishuCard(card: Record<string, unknown>): Promise<void> {
  const webhook = process.env.FEISHU_BOT_WEBHOOK;
  if (!webhook) return;
  // SSRF 防护：webhook 只允许飞书开放平台域名（env 被改时也打不到内网）。
  let host = '';
  try {
    host = new URL(webhook).hostname;
  } catch {
    return;
  }
  if (!host.endsWith('.feishu.cn') && !host.endsWith('.larksuite.com')) return;
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg_type: 'interactive', card })
    });
    if (!res.ok) throw new Error(`feishu bot HTTP ${res.status}`);
  } catch (e) {
    console.error(
      '[telegram-webhook] feishu notify failed:',
      e instanceof Error ? e.message : 'unknown'
    );
  }
}

async function replyTelegram(chatId: number, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (e) {
    console.error('[telegram-webhook] reply failed:', e instanceof Error ? e.message : 'unknown');
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'telegram webhook not configured' }, { status: 403 });
  }
  if (!secretMatches(request.headers.get('x-telegram-bot-api-secret-token') ?? '', secret)) {
    return NextResponse.json({ error: 'bad secret token' }, { status: 403 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true }); // 坏包体也回 200，别让 TG 重试
  }

  const msg = update.message;
  if (msg?.chat?.id != null) {
    const handle = msg.from?.username ? `@${escMd(msg.from.username)}` : '未提供';
    const phone = msg.contact?.phone_number ? escMd(msg.contact.phone_number) : '';
    const when = msg.date
      ? new Date(msg.date * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      : '';
    const body = (msg.text ?? (msg.contact ? '[共享联系人]' : '[非文本消息]')).slice(0, 800);

    await sendFeishuCard({
      header: {
        title: { tag: 'plain_text', content: '📱 Telegram 进线' },
        template: 'blue'
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**用户**：${handle}` } },
            {
              is_short: true,
              text: { tag: 'lark_md', content: `**姓名**：${escMd(displayName(msg.from))}` }
            },
            { is_short: true, text: { tag: 'lark_md', content: `**chat_id**：${msg.chat.id}` } },
            {
              is_short: true,
              text: { tag: 'lark_md', content: `**电话**：${phone || '—'}` }
            }
          ]
        },
        {
          tag: 'div',
          text: { tag: 'lark_md', content: `**消息**：\n${escMd(body)}` }
        },
        { tag: 'hr' },
        {
          tag: 'note',
          elements: [{ tag: 'plain_text', content: `${when} · 运营请在 Telegram 内回复客户` }]
        }
      ]
    });

    await replyTelegram(
      msg.chat.id,
      'Thanks for reaching out! Our sales team will get back to you shortly. ' +
        'You can also WhatsApp us for a faster reply.'
    );
  }

  return NextResponse.json({ ok: true });
}
