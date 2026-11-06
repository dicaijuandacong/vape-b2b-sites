// ephemeral-fs（Vercel 临时文件系统守卫）单元测试（node:test，Node >= 20 自带）。
// 运行：npm run test:unit
// 守卫是纯逻辑（只看 process.env.VERCEL），测试不落盘、不碰网络。
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  assertLocalFsWritable,
  EphemeralFsWriteError,
  isEphemeralFsWriteError,
  EPHEMERAL_FS_ERROR
} from '../src/lib/ephemeral-fs.ts';

describe('assertLocalFsWritable（D：上传诚实化守卫）', () => {
  afterEach(() => {
    delete process.env.VERCEL;
  });

  it('VERCEL 存在时抛 EphemeralFsWriteError（拒绝假成功）', () => {
    process.env.VERCEL = '1';
    assert.throws(
      () => assertLocalFsWritable(),
      (e) => isEphemeralFsWriteError(e) && e.message === EPHEMERAL_FS_ERROR
    );
  });

  it('本地（无 VERCEL）放行，保持现状', () => {
    delete process.env.VERCEL;
    assert.doesNotThrow(() => assertLocalFsWritable());
  });

  it('isEphemeralFsWriteError 识别实例与跨 bundle 的名字匹配', () => {
    assert.equal(isEphemeralFsWriteError(new EphemeralFsWriteError()), true);
    const crossBundle = new Error('x');
    crossBundle.name = 'EphemeralFsWriteError';
    assert.equal(isEphemeralFsWriteError(crossBundle), true);
    assert.equal(isEphemeralFsWriteError(new Error('别的错误')), false);
    assert.equal(isEphemeralFsWriteError('not an error'), false);
    assert.equal(isEphemeralFsWriteError(undefined), false);
  });

  it('错误信息为中文且明确说明图片未保存', () => {
    assert.match(EPHEMERAL_FS_ERROR, /未保存/);
    assert.match(EPHEMERAL_FS_ERROR, /飞书存储/);
  });
});
