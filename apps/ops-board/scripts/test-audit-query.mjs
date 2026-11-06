// 审计读取翻页 / 排序 / 截断逻辑单元测试（node:test，Node >= 20 自带）。
// 运行：npm run test:unit
// audit.ts 依赖 @/ 路径别名无法直接测；被测逻辑在零依赖的 audit-query.ts。
// 覆盖审查发现的边界：表超过 500 条（一页）后，只读第一页会永远丢新记录。
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { collectAllPages, newestFirst } from '../src/lib/audit-query.ts';

/** 造一条审计形状的记录：at 用秒级递增的 ISO 时间戳。 */
function entry(seq) {
  return { at: new Date(Date.UTC(2026, 0, 1, 0, 0, seq)).toISOString(), seq };
}

/** 把 items 切成 pageSize 一页的模拟分页响应序列（旧→新）。 */
function pagedFetcher(items, pageSize) {
  const pages = [];
  for (let i = 0; i < items.length; i += pageSize) {
    const pageItems = items.slice(i, i + pageSize);
    const last = i + pageSize >= items.length;
    pages.push({
      items: pageItems,
      hasMore: !last,
      ...(last ? {} : { pageToken: `tok_${i / pageSize + 1}` })
    });
  }
  const seenTokens = [];
  const fetchPage = async (pageToken) => {
    seenTokens.push(pageToken);
    const idx = pageToken === undefined ? 0 : Number(pageToken.replace('tok_', ''));
    return pages[idx];
  };
  return { fetchPage, seenTokens };
}

describe('collectAllPages（翻页取全量）', () => {
  it('翻页直到 hasMore=false，最后一页的新记录必须拿到', async () => {
    const items = [entry(1), entry(2), entry(3), entry(4), entry(5)];
    const { fetchPage, seenTokens } = pagedFetcher(items, 2);
    const all = await collectAllPages(fetchPage);
    assert.deepEqual(all, items);
    // 验证 pageToken 被正确透传：首页不带 token，后续带上一页给的 token
    assert.deepEqual(seenTokens, [undefined, 'tok_1', 'tok_2']);
  });

  it('单页（hasMore=false）只请求一次', async () => {
    const items = [entry(1)];
    const { fetchPage, seenTokens } = pagedFetcher(items, 500);
    const all = await collectAllPages(fetchPage);
    assert.deepEqual(all, items);
    assert.equal(seenTokens.length, 1);
  });

  it('防御：hasMore=true 但缺 pageToken 时停止，不死循环', async () => {
    let calls = 0;
    const all = await collectAllPages(async () => {
      calls += 1;
      return { items: [entry(calls)], hasMore: true }; // 故意不给 pageToken
    });
    assert.equal(calls, 1);
    assert.equal(all.length, 1);
  });

  it('空表返回空数组', async () => {
    const all = await collectAllPages(async () => ({ items: [], hasMore: false }));
    assert.deepEqual(all, []);
  });
});

describe('newestFirst（倒序 + 截断）', () => {
  it('乱序输入按时间倒序，取前 limit 条', () => {
    const items = [entry(3), entry(1), entry(5), entry(2), entry(4)];
    const top2 = newestFirst(items, 2);
    assert.deepEqual(
      top2.map((e) => e.seq),
      [5, 4]
    );
  });

  it('边界：恰好等于 limit 不截断；limit=1 只取最新一条；空数组返回空', () => {
    const items = [entry(1), entry(2), entry(3)];
    assert.equal(newestFirst(items, 3).length, 3);
    assert.deepEqual(
      newestFirst(items, 1).map((e) => e.seq),
      [3]
    );
    assert.deepEqual(newestFirst([], 200), []);
  });
});

describe('组合：审查发现的 >500 条冻结场景', () => {
  it('501 条跨 2 页、limit=500 → 最新一条在结果里，最旧一条被截掉', async () => {
    // Bitable 返回顺序旧→新：第 501 条（最新）在第二页
    const items = Array.from({ length: 501 }, (_, i) => entry(i + 1));
    const { fetchPage } = pagedFetcher(items, 500);
    const all = await collectAllPages(fetchPage);
    // 与 audit.ts readBitableAudit 相同的收尾：反转后倒序截前 N
    const result = newestFirst(all.reverse(), 500);
    assert.equal(result.length, 500);
    assert.equal(result[0].seq, 501, '最新记录必须在第一条');
    assert.equal(result.at(-1).seq, 2, '最旧一条（seq=1）被截掉');
    assert.equal(
      result.some((e) => e.seq === 1),
      false
    );
  });
});
