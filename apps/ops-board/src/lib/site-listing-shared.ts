// ============================================================
// 单站上下架 — 客户端/服务端共享的类型与纯函数（无 node:fs 依赖）
// ============================================================
// 三个受管站点共享一份主 catalog；本模块定义「每站点覆盖」的数据形状：
// 某个 SKU 在某站可以单独下架（如欧洲站因 TPD 下架），其他站不受影响。
//
// 注意：本文件**不能** import node:fs —— 客户端组件（grid/table/详情页）
// 也会引用它。文件读写走 `@/lib/site-listings`（仅服务端）。
// ============================================================

/** 受管的三个站点（vapegogogo 是独立站，不在产品管理范围内）。 */
export type ListingSite = 'dubai' | 'gulf' | 'europe';

/** 单个 SKU 在三个站点的有效上下架状态（true=上架，false=下架）。 */
export type SiteListingState = Record<ListingSite, boolean>;

/**
 * 覆盖文件的数据形状：
 * productId → site → bool。缺某站 = 跟随全局 active（继承）。
 */
export type SiteListingMap = Record<string, Partial<Record<ListingSite, boolean>>>;

export const LISTING_SITES: Array<{ key: ListingSite; label: string }> = [
  { key: 'dubai', label: '迪拜' },
  { key: 'gulf', label: '沙特' },
  { key: 'europe', label: '欧洲' }
];

export const LISTING_SITE_KEYS = LISTING_SITES.map((s) => s.key) as ListingSite[];

export function isListingSite(value: unknown): value is ListingSite {
  return typeof value === 'string' && (LISTING_SITE_KEYS as string[]).includes(value);
}

/**
 * 计算某 SKU 在三个站点的有效状态：
 * 站点覆盖优先；无覆盖的站点继承全局 active。
 */
export function resolveSiteListings(
  map: SiteListingMap,
  productId: string,
  globalActive: boolean
): SiteListingState {
  const overrides = map[productId] ?? {};
  return {
    dubai: overrides.dubai ?? globalActive,
    gulf: overrides.gulf ?? globalActive,
    europe: overrides.europe ?? globalActive
  };
}
