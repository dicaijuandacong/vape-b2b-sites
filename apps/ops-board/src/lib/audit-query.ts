// ============================================================
// 审计读取的翻页 / 排序 / 截断逻辑（纯函数，零依赖，可单测）
// ============================================================
// 从 audit.ts 抽出来单独成模块：audit.ts 依赖 @/auth 等路径别名，
// node --test 无法解析；本模块零依赖，可直接被 scripts/*.mjs 测试导入。
// ============================================================

/** 一页分页结果（对 Bitable list records 响应的最小抽象）。 */
export interface PageFetchResult<T> {
  items: T[];
  hasMore: boolean;
  pageToken?: string;
}

/**
 * 驱动 page_token 翻页直到 hasMore=false，按页序（旧→新）收集全量记录。
 * Bitable list API 按写入顺序分页返回，新记录在最后一页 —— 只读第一页
 * 会在表超过 page_size 后永远丢新记录，审计页冻结在过去。
 * 防御：hasMore=true 但响应缺 pageToken 时停止（避免 API 异常导致死循环）。
 */
export async function collectAllPages<T>(
  fetchPage: (pageToken?: string) => Promise<PageFetchResult<T>>
): Promise<T[]> {
  const all: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await fetchPage(pageToken);
    all.push(...page.items);
    pageToken = page.hasMore && page.pageToken ? page.pageToken : undefined;
  } while (pageToken !== undefined);
  return all;
}

/**
 * 按 ISO 时间戳倒序（新→旧）排序并截取前 limit 条。
 * ISO 8601 UTC 字符串等宽，字典序即时间序。
 */
export function newestFirst<T extends { at: string }>(entries: T[], limit: number): T[] {
  return [...entries].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, limit);
}
