import { after, NextRequest, NextResponse } from 'next/server';
import {
  isCardOperatorAllowed,
  LEAD_CARD_OP_LABELS,
  markFingerprintIfNew,
  parseCardCallback,
  patchCardMessage,
  readLeadRecord,
  runLeadCardAction,
  sendChatText,
  verifyCardSignature
} from '@/lib/feishu-card';
import { updateLeadStatus } from '@/lib/leads';
import { addFollowup } from '@/lib/followups';
import { writeAudit } from '@/lib/audit';
import type { LeadStatus } from '@/features/kanban/api/types';

/**
 * 飞书卡片回调（card.action.trigger）—— 询盘卡片三按钮的回写入口。
 *
 * 安全与降级（与 telegram/webhook 同构）：
 *  - 验签 SHA256(timestamp+nonce+EncryptKey+原始 body)，先 req.text() 再 JSON.parse；
 *  - 未配置 FEISHU_CARD_ENCRYPT_KEY 时一律 403（默认关死，配了才开）；
 *  - 3 秒硬超时 → 立即 200 + toast，写回走 after() 异步（Vercel waitUntil 保活）；
 *  - 延时更新卡片用 PATCH 消息 API（message_id），不依赖 30 分钟短命的 event.token；
 *  - 幂等双保险：进程内指纹去重 + Bitable 状态机判定（已是目标状态则跳过）；
 *  - 失败在群里补中文错误卡，绝不静默。
 *
 * 设置步骤见 docs/superpowers/plans/FEISHU-CARD-SETUP-CARD.md。
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** 卡片回调即时响应的 toast（响应体形态见飞书卡片回调文档）。 */
function toast(type: 'info' | 'success' | 'error' | 'warning', content: string) {
  return NextResponse.json({ toast: { type, content } });
}

export async function POST(request: NextRequest) {
  const encryptKey = process.env.FEISHU_CARD_ENCRYPT_KEY;
  if (!encryptKey) {
    return NextResponse.json({ error: 'feishu card callback not configured' }, { status: 403 });
  }

  // 验签必须用原始请求体 —— 先 text() 再 parse，顺序不能反。
  const rawBody = await request.text();
  const signatureOk = verifyCardSignature({
    timestamp: request.headers.get('x-lark-request-timestamp'),
    nonce: request.headers.get('x-lark-request-nonce'),
    signature: request.headers.get('x-lark-signature'),
    encryptKey,
    rawBody
  });
  if (!signatureOk) {
    return NextResponse.json({ error: 'bad signature' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCardCallback(body);

  // 飞书后台配回调地址时的 URL Challenge 握手：原样回显 challenge。
  if (parsed.kind === 'challenge') {
    const verificationToken = process.env.FEISHU_CARD_VERIFICATION_TOKEN;
    if (verificationToken && parsed.token !== verificationToken) {
      return NextResponse.json({ error: 'bad verification token' }, { status: 403 });
    }
    return NextResponse.json({ challenge: parsed.challenge });
  }

  if (parsed.kind !== 'action') {
    // 未知事件（含旧 schema 事件）：回 200 忽略，避免触发重推。
    return NextResponse.json({ ok: true });
  }

  // 操作者白名单（复用 ADMIN_OPEN_IDS）；非白名单只提示，不改状态。
  if (!isCardOperatorAllowed(parsed.operatorOpenId)) {
    return toast('warning', '无权限：仅管理员可在卡片上标记询盘状态');
  }

  // 进程内去重：同一卡片同一按钮的重推直接 ACK（状态机判定在异步侧再兜底）。
  const fingerprint = `${parsed.messageId ?? 'nomsg'}:${parsed.recordId}:${parsed.op}`;
  if (!markFingerprintIfNew(fingerprint)) {
    return toast('info', '该操作已提交过，正在处理中…');
  }

  after(async () => {
    await runLeadCardAction(parsed, {
      readLead: readLeadRecord,
      writeStatus: async (recordId, status) => {
        // target status 常量即既有 LeadStatus 枚举值（已联系/成交/流失）
        await updateLeadStatus(recordId, status as LeadStatus);
      },
      addFollowupLog: async (recordId, content) => {
        await addFollowup({ leadId: recordId, channel: 'note', content });
      },
      patchCard: patchCardMessage,
      reportError: async (chatId, text) => {
        if (chatId) await sendChatText(chatId, text);
        else console.error('[feishu-card] no chat_id to report:', text);
      },
      audit: async (recordId, op, target, operatorName) => {
        await writeAudit({
          actorName: operatorName,
          actorRole: 'admin',
          action: 'lead.status.update',
          target: recordId,
          detail: `飞书卡片按钮「${LEAD_CARD_OP_LABELS[op]}」→ ${target}`
        });
      }
    });
  });

  const label = LEAD_CARD_OP_LABELS[parsed.op];
  return toast('info', `⏳ 正在标记为「${label}」…`);
}
