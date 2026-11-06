// isAnySourceMock / mergeSources 单元测试（node:test，Node >= 20 自带，无需装框架）。
// 运行：npm run test:unit
// 用 .mjs + 相对导入 .ts 是为了绕开 tsc 的路径别名 —— data-source.ts 本身零依赖。
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAnySourceMock, mergeSources } from '../src/lib/data-source.ts';

describe('isAnySourceMock', () => {
  it('全部数据源为 feishu 时返回 false', () => {
    assert.equal(isAnySourceMock('feishu', 'feishu', 'feishu'), false);
  });

  it('任一数据源为 mock 即返回 true', () => {
    assert.equal(isAnySourceMock('mock', 'feishu', 'feishu'), true);
    assert.equal(isAnySourceMock('feishu', 'mock', 'feishu'), true);
    assert.equal(isAnySourceMock('feishu', 'feishu', 'mock'), true);
    assert.equal(isAnySourceMock('mock', 'mock'), true);
  });

  it('undefined / null（源未返回）不算 mock，交给上层兜底', () => {
    assert.equal(isAnySourceMock(undefined, null), false);
    assert.equal(isAnySourceMock('feishu', undefined), false);
  });

  it('空参数返回 false', () => {
    assert.equal(isAnySourceMock(), false);
  });
});

describe('mergeSources（跨源推导结果的可信度合并）', () => {
  // 回归场景：getFollowupTasks 的任务由 leads + followups 两源推导。
  // 旧实现 source 只继承 leads —— followups 表挂了（回退 mock）而 leads
  // 正常时，周报/铃铛会把假待办数当真数据推出去。
  it('leads 真 + followups 假（followups 表被删/权限撤）→ 必须 mock', () => {
    assert.equal(mergeSources('feishu', 'mock'), 'mock');
  });

  it('leads 假 + followups 真 → mock', () => {
    assert.equal(mergeSources('mock', 'feishu'), 'mock');
  });

  it('两源都真 → feishu', () => {
    assert.equal(mergeSources('feishu', 'feishu'), 'feishu');
  });

  it('两源都假 → mock；源缺失（undefined）不污名化 feishu', () => {
    assert.equal(mergeSources('mock', 'mock'), 'mock');
    assert.equal(mergeSources('feishu', undefined), 'feishu');
  });
});
