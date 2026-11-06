// ============================================================
// Vercel 临时文件系统守卫（纯逻辑，无依赖，可单测）
// ============================================================
// Vercel 的 serverless 文件系统是临时的：每次部署重建、实例间不共享。
// 写本地文件（public/uploads、public/generated、data/*.jsonl）的接口
// 在 Vercel 上必须拒绝 —— 否则返回成功但数据随部署蒸发，
// 假成功比报错更糟。读操作可保留（顶多读到仓库里提交的旧文件）。
//
// 使用：local backend 的写操作入口调用 assertLocalFsWritable()；
// 路由层 catch 里用 isEphemeralFsWriteError(e) 识别后转 503 + 中文说明。
// ============================================================

/** 拒绝写入时的用户可见错误信息（中文，运营可直接读懂下一步）。 */
export const EPHEMERAL_FS_ERROR =
  '生产环境未配置持久化存储，图片未保存。请在本地运行后通过 git 提交，或配置飞书存储。';

/** local 文件写操作在 Vercel 上抛出的拒绝错误；路由层识别后转 503。 */
export class EphemeralFsWriteError extends Error {
  constructor(message: string = EPHEMERAL_FS_ERROR) {
    super(message);
    this.name = 'EphemeralFsWriteError';
  }
}

/** instanceof 跨 bundle 可能失效，名字匹配兜底。 */
export function isEphemeralFsWriteError(e: unknown): e is EphemeralFsWriteError {
  return (
    e instanceof EphemeralFsWriteError || (e instanceof Error && e.name === 'EphemeralFsWriteError')
  );
}

/** local backend 写操作入口守卫：Vercel 环境直接抛 EphemeralFsWriteError。 */
export function assertLocalFsWritable(): void {
  if (process.env.VERCEL) throw new EphemeralFsWriteError();
}
