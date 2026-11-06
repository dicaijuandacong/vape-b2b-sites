// 飞书卡片回调支撑库单元测试（node:test，Node >= 22 直接跑 .ts）。
// 运行：npm run test:unit
// 覆盖：验签算法 / challenge 握手 / action 解析 / 幂等判定 / 写回编排（mock 依赖）。
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  _resetFingerprintsForTest,
  buildLeadResultCard,
  cardOperatorDisplayName,
  computeCardSignature,
  decideWriteback,
  isCardOperatorAllowed,
  LEAD_CARD_OP_TARGET_STATUS,
  markFingerprintIfNew,
  parseCardCallback,
  runLeadCardAction,
  SIGNATURE_MAX_SKEW_SECONDS,
  verifyCardSignature
} from '../src/lib/feishu-card.ts';

// ---------- 验签 ----------

const KEY = 'test-encrypt-key';
const BODY = JSON.stringify({ hello: 'world', 中文: '询盘' });

function sign(ts, nonce, body = BODY) {
  return createHash('sha256').update(ts + nonce + KEY + body, 'utf8').digest('hex');
}

describe('computeCardSignature / verifyCardSignature', () => {
  const now = 1_800_000_000;

  it('官方算法：SHA256(timestamp+nonce+key+原始body) hex 一致', () => {
    const ts = String(now);
    const expected = sign(ts, 'nonce-1');
    assert.equal(computeCardSignature(ts, 'nonce-1', KEY, BODY), expected);
    // 中文字符按 utf8 拼接，不能出错
    assert.equal(computeCardSignature(ts, 'n', KEY, '{"a":"询"}'), sign(ts, 'n', '{"a":"询"}'));
  });

  it('合法签名通过', () => {
    const ts = String(now);
    assert.equal(
      verifyCardSignature({
        timestamp: ts,
        nonce: 'n1',
        signature: sign(ts, 'n1'),
        encryptKey: KEY,
        rawBody: BODY,
        nowSeconds: now
      }),
      true
    );
  });

  it('body 被改动一个字符 → 验签失败（必须用原始 body）', () => {
    const ts = String(now);
    const tampered = BODY.replace('world', 'World');
    assert.equal(
      verifyCardSignature({
        timestamp: ts,
        nonce: 'n1',
        signature: sign(ts, 'n1'),
        encryptKey: KEY,
        rawBody: tampered,
        nowSeconds: now
      }),
      false
    );
  });

  it('EncryptKey 不同 → 验签失败', () => {
    const ts = String(now);
    assert.equal(
      verifyCardSignature({
        timestamp: ts,
        nonce: 'n1',
        signature: sign(ts, 'n1'),
        encryptKey: 'wrong-key',
        rawBody: BODY,
        nowSeconds: now
      }),
      false
    );
  });

  it('缺头（timestamp/nonce/signature 任一）→ 失败', () => {
    const ts = String(now);
    const good = sign(ts, 'n1');
    const base = { timestamp: ts, nonce: 'n1', signature: good, encryptKey: KEY, rawBody: BODY, nowSeconds: now };
    assert.equal(verifyCardSignature({ ...base, timestamp: null }), false);
    assert.equal(verifyCardSignature({ ...base, nonce: null }), false);
    assert.equal(verifyCardSignature({ ...base, signature: null }), false);
  });

  it('时间戳超窗（防重放）→ 失败；窗内 → 通过', () => {
    const stale = String(now - SIGNATURE_MAX_SKEW_SECONDS - 1);
    assert.equal(
      verifyCardSignature({
        timestamp: stale,
        nonce: 'n1',
        signature: sign(stale, 'n1'),
        encryptKey: KEY,
        rawBody: BODY,
        nowSeconds: now
      }),
      false
    );
    const edge = String(now - SIGNATURE_MAX_SKEW_SECONDS);
    assert.equal(
      verifyCardSignature({
        timestamp: edge,
        nonce: 'n1',
        signature: sign(edge, 'n1'),
        encryptKey: KEY,
        rawBody: BODY,
        nowSeconds: now
      }),
      true
    );
  });

  it('签名大小写不敏感（hex 大写也认），但长度不符直接 false', () => {
    const ts = String(now);
    assert.equal(
      verifyCardSignature({
        timestamp: ts,
        nonce: 'n1',
        signature: sign(ts, 'n1').toUpperCase(),
        encryptKey: KEY,
        rawBody: BODY,
        nowSeconds: now
      }),
      true
    );
    assert.equal(
      verifyCardSignature({
        timestamp: ts,
        nonce: 'n1',
        signature: 'abcd',
        encryptKey: KEY,
        rawBody: BODY,
        nowSeconds: now
      }),
      false
    );
  });
});

// ---------- 回调体解析 ----------

describe('parseCardCallback', () => {
  it('url_verification → challenge 原样取出（含 token）', () => {
    const parsed = parseCardCallback({
      challenge: 'ch_abc123',
      token: 'vt_xyz',
      type: 'url_verification'
    });
    assert.deepEqual(parsed, { kind: 'challenge', challenge: 'ch_abc123', token: 'vt_xyz' });
  });

  it('challenge 缺字段 → unknown（不能回显空 challenge）', () => {
    assert.deepEqual(parseCardCallback({ type: 'url_verification' }), { kind: 'unknown' });
  });

  it('标准卡片按钮回调：解析 op / record_id / operator / message_id / chat_id', () => {
    const parsed = parseCardCallback({
      operator: { open_id: 'ou_operator1', tenant_key: 't', user_id: 'u' },
      token: 'event-token-30min',
      action: { tag: 'button', value: { op: 'won', record_id: 'recABC' } },
      context: { open_message_id: 'om_x', open_chat_id: 'oc_y' }
    });
    assert.deepEqual(parsed, {
      kind: 'action',
      op: 'won',
      recordId: 'recABC',
      operatorOpenId: 'ou_operator1',
      messageId: 'om_x',
      chatId: 'oc_y'
    });
  });

  it('兼容扁平字段（open_id / open_message_id 在顶层）', () => {
    const parsed = parseCardCallback({
      open_id: 'ou_flat',
      open_message_id: 'om_flat',
      open_chat_id: 'oc_flat',
      action: { value: { op: 'followed_up', record_id: 'rec1' } }
    });
    assert.equal(parsed.kind, 'action');
    assert.equal(parsed.operatorOpenId, 'ou_flat');
    assert.equal(parsed.messageId, 'om_flat');
  });

  it('未知 op / 缺 record_id / 缺 operator → unknown（不触发状态写）', () => {
    assert.deepEqual(
      parseCardCallback({ operator: { open_id: 'ou_1' }, action: { value: { op: 'delete', record_id: 'rec1' } } }),
      { kind: 'unknown' }
    );
    assert.deepEqual(
      parseCardCallback({ operator: { open_id: 'ou_1' }, action: { value: { op: 'won' } } }),
      { kind: 'unknown' }
    );
    assert.deepEqual(
      parseCardCallback({ action: { value: { op: 'won', record_id: 'rec1' } } }),
      { kind: 'unknown' }
    );
    assert.deepEqual(parseCardCallback(null), { kind: 'unknown' });
    assert.deepEqual(parseCardCallback('string'), { kind: 'unknown' });
  });

  it('action.value 里混有无关键不影响解析', () => {
    const parsed = parseCardCallback({
      operator: { open_id: 'ou_1' },
      action: { value: { op: 'invalid', record_id: 'rec9', extra: 'x' } }
    });
    assert.equal(parsed.kind, 'action');
    assert.equal(parsed.op, 'invalid');
  });
});

// ---------- 白名单 ----------

describe('isCardOperatorAllowed / cardOperatorDisplayName', () => {
  it('未配置 ADMIN_OPEN_IDS → fail soft 放行（与 rbac 一致）', () => {
    assert.equal(isCardOperatorAllowed('ou_anyone', ''), true);
    assert.equal(isCardOperatorAllowed('ou_anyone', undefined), true);
  });

  it('配置了名单 → 仅名单内 open_id 可操作', () => {
    const env = 'ou_boss, ou_admin2 ,';
    assert.equal(isCardOperatorAllowed('ou_boss', env), true);
    assert.equal(isCardOperatorAllowed('ou_admin2', env), true);
    assert.equal(isCardOperatorAllowed('ou_intern', env), false);
  });

  it('管理员显示名脱敏为「Admin」，其他为「运营」', () => {
    const env = 'ou_boss';
    assert.equal(cardOperatorDisplayName('ou_boss', env), 'Admin');
    assert.equal(cardOperatorDisplayName('ou_other', env), '运营');
  });
});

// ---------- 幂等 ----------

describe('decideWriteback / markFingerprintIfNew', () => {
  it('状态已是目标值 → already（跳过写入）；否则 apply', () => {
    assert.equal(decideWriteback('新询盘', '已联系'), 'apply');
    assert.equal(decideWriteback('已联系', '已联系'), 'already');
    assert.equal(decideWriteback(' 成交 ', '成交'), 'already');
  });

  it('同一指纹 10 分钟内重复 → false；超窗 → true', () => {
    _resetFingerprintsForTest();
    const t0 = 1_000_000;
    assert.equal(markFingerprintIfNew('om_1:rec1:won', t0), true);
    assert.equal(markFingerprintIfNew('om_1:rec1:won', t0 + 1000), false);
    assert.equal(markFingerprintIfNew('om_1:rec1:invalid', t0 + 1000), true); // 不同按钮
    assert.equal(markFingerprintIfNew('om_1:rec1:won', t0 + 11 * 60 * 1000), true); // 超窗
    _resetFingerprintsForTest();
  });
});

// ---------- 写回编排（mock 依赖） ----------

function makeSnapshot(status) {
  return {
    recordId: 'rec1',
    status,
    payload: {
      siteKey: 'europe',
      type: 'wholesale',
      email: 'buyer@example.de',
      company: 'Dampf Palast GmbH',
      phone: '+49 151 2345678'
    }
  };
}

function makeDeps(snapshot, overrides = {}) {
  const calls = { write: [], followup: [], patch: [], error: [], audit: [] };
  return {
    calls,
    deps: {
      readLead: async () => snapshot,
      writeStatus: async (id, status) => void calls.write.push([id, status]),
      addFollowupLog: async (id, content) => void calls.followup.push([id, content]),
      patchCard: async (mid, card) => void calls.patch.push([mid, card]),
      reportError: async (chatId, text) => void calls.error.push([chatId, text]),
      audit: async (id, op, target, name) => void calls.audit.push([id, op, target, name]),
      now: new Date('2026-08-27T06:32:00.000Z'),
      ...overrides
    }
  };
}

const ACTION = {
  kind: 'action',
  op: 'won',
  recordId: 'rec1',
  operatorOpenId: 'ou_boss',
  messageId: 'om_x',
  chatId: 'oc_y'
};

describe('runLeadCardAction', () => {
  it('正常路径：写状态 → 跟进日志 → 审计 → PATCH 卡片（note 含操作人与状态）', async () => {
    const { deps, calls } = makeDeps(makeSnapshot('新询盘'));
    const result = await runLeadCardAction(ACTION, deps);
    assert.equal(result, 'applied');
    assert.deepEqual(calls.write, [['rec1', '成交']]);
    assert.equal(calls.followup.length, 1);
    assert.match(calls.followup[0][1], /飞书卡片标记为「成交」/);
    assert.equal(calls.audit.length, 1);
    assert.equal(calls.patch.length, 1);
    assert.equal(calls.patch[0][0], 'om_x');
    // 结果卡：按钮区变 note，含操作人与状态
    const note = JSON.stringify(calls.patch[0][1]);
    assert.match(note, /已由 运营 标记为「成交」/);
    assert.equal(calls.error.length, 0);
  });

  it('幂等：状态已是目标值 → 不写状态/不写跟进，但仍 PATCH 卡片告知', async () => {
    const { deps, calls } = makeDeps(makeSnapshot('成交'));
    const result = await runLeadCardAction(ACTION, deps);
    assert.equal(result, 'skipped');
    assert.equal(calls.write.length, 0);
    assert.equal(calls.followup.length, 0);
    assert.equal(calls.audit.length, 0);
    assert.equal(calls.patch.length, 1);
    assert.match(JSON.stringify(calls.patch[0][1]), /状态已是「成交」，本次点击未重复写入/);
  });

  it('记录不存在 → not_found + 群里中文报错', async () => {
    const { deps, calls } = makeDeps(null);
    const result = await runLeadCardAction(ACTION, deps);
    assert.equal(result, 'not_found');
    assert.equal(calls.write.length, 0);
    assert.equal(calls.error.length, 1);
    assert.match(calls.error[0][1], /找不到询盘记录 rec1/);
  });

  it('写 Bitable 抛错 → error + 群里中文报错（不静默）', async () => {
    const { deps, calls } = makeDeps(makeSnapshot('新询盘'), {
      writeStatus: async () => {
        throw new Error('feishu update status HTTP 500');
      }
    });
    const result = await runLeadCardAction(ACTION, deps);
    assert.equal(result, 'error');
    assert.equal(calls.patch.length, 0);
    assert.equal(calls.error.length, 1);
    assert.match(calls.error[0][1], /回写失败/);
    assert.match(calls.error[0][1], /HTTP 500/);
  });

  it('缺 messageId 时不 PATCH，但状态照常写', async () => {
    const { deps, calls } = makeDeps(makeSnapshot('新询盘'));
    const { messageId, ...noMsg } = ACTION;
    const result = await runLeadCardAction(noMsg, deps);
    assert.equal(result, 'applied');
    assert.equal(calls.write.length, 1);
    assert.equal(calls.patch.length, 0);
  });
});

// ---------- 结果卡片 ----------

describe('buildLeadResultCard', () => {
  it('状态按钮整行替换为 note，URL 按钮（WhatsApp/邮件）保留', () => {
    const card = buildLeadResultCard(
      {
        siteKey: 'europe',
        type: 'wholesale',
        email: 'a@b.de',
        phone: '+49 151 2345678'
      },
      'rec1',
      '✅ 已由 Admin 标记为「已跟进」 · 08/27 14:32'
    );
    const json = JSON.stringify(card);
    assert.match(json, /已由 Admin 标记为「已跟进」/);
    assert.match(json, /wa\.me\/491512345678/);
    assert.match(json, /mailto/);
    assert.doesNotMatch(json, /followed_up/); // 状态回调按钮已移除
  });
});

// ---------- 状态映射完整性 ----------

describe('LEAD_CARD_OP_TARGET_STATUS', () => {
  it('三按钮映射到既有 7 态内的合法值', () => {
    const VALID = ['新询盘', '已联系', '已报价', '样品单', '成交', '流失', '待跟进'];
    assert.equal(LEAD_CARD_OP_TARGET_STATUS.followed_up, '已联系');
    assert.equal(LEAD_CARD_OP_TARGET_STATUS.won, '成交');
    assert.equal(LEAD_CARD_OP_TARGET_STATUS.invalid, '流失');
    for (const target of Object.values(LEAD_CARD_OP_TARGET_STATUS)) {
      assert.ok(VALID.includes(target), `${target} 必须是合法 LeadStatus`);
    }
  });
});
