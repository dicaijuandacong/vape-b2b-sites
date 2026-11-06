// ============================================================
// 单站上下架 — 服务端持久化（Node.js / server only）
// ============================================================
// 覆盖数据落盘到 `ops-v2/data/site-listings.json`：
//   { "version": 1, "listings": { "<productId>": { "europe": false } } }
// 某个 productId 缺某站 = 该站继承全局 active（见 site-listing-shared）。
//
// 与 catalog-override.json 的关系：catalog-override 管「全局」字段
// （含全局 active 软删除），site-listings 管「每站点」覆盖，两者叠加。
//
// 本模块使用 node:fs —— 只能从 Route Handlers / Server Components 引用。
// ============================================================

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ListingSite, SiteListingMap, SiteListingState } from './site-listing-shared';
import { isListingSite, resolveSiteListings } from './site-listing-shared';
import { kvGet, kvSet } from './bitable-kv';

const LISTINGS_PATH = path.resolve(process.cwd(), 'data', 'site-listings.json');
const KV_KEY = 'site_listings';

interface SiteListingsFile {
  version: 1;
  listings: SiteListingMap;
}

/** 过滤非法站点 key / 非布尔值，防止脏数据扩散。 */
function sanitize(raw: unknown): SiteListingMap {
  const parsed = raw as SiteListingsFile | null;
  if (!parsed?.listings || typeof parsed.listings !== 'object') return {};
  const clean: SiteListingMap = {};
  for (const [productId, sites] of Object.entries(parsed.listings)) {
    if (!sites || typeof sites !== 'object') continue;
    const entry: Partial<Record<ListingSite, boolean>> = {};
    for (const [site, listed] of Object.entries(sites)) {
      if (isListingSite(site) && typeof listed === 'boolean') {
        entry[site] = listed;
      }
    }
    if (Object.keys(entry).length > 0) clean[productId] = entry;
  }
  return clean;
}

/**
 * 读取站点上下架覆盖。优先飞书 ops_kv（生产持久化，部署不丢），
 * 回退本地文件（开发模式）。
 */
export async function getSiteListings(): Promise<SiteListingMap> {
  const remote = await kvGet<SiteListingsFile>(KV_KEY);
  if (remote) return sanitize(remote);
  try {
    const raw = await fs.readFile(LISTINGS_PATH, 'utf8');
    return sanitize(JSON.parse(raw));
  } catch {
    return {};
  }
}

async function writeSiteListings(listings: SiteListingMap): Promise<void> {
  const data: SiteListingsFile = { version: 1, listings };
  // 飞书 KV 为主存储（配置了 env 时）；本地文件作缓存同步写。
  const result = await kvSet(KV_KEY, data);
  if (result === 'failed') {
    // 生产持久化失败 —— 必须让调用方/运营知道，否则改动静默丢失。
    throw new Error('站点上下架写入飞书失败，改动未保存，请重试');
  }
  try {
    await fs.mkdir(path.dirname(LISTINGS_PATH), { recursive: true });
    await fs.writeFile(LISTINGS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch {
    /* 本地缓存写失败不影响 —— 生产环境以飞书为准 */
  }
}

/** 设置某 SKU 在某站的上下架状态，返回更新后的全站有效状态。 */
export async function setSiteListing(
  productId: string,
  site: ListingSite,
  listed: boolean,
  globalActive: boolean
): Promise<SiteListingState> {
  const listings = await getSiteListings();
  listings[productId] = { ...listings[productId], [site]: listed };
  await writeSiteListings(listings);
  return resolveSiteListings(listings, productId, globalActive);
}

/** 查询某 SKU 在三个站点的有效状态（覆盖优先，缺省继承全局 active）。 */
export async function getProductSiteListings(
  productId: string,
  globalActive: boolean
): Promise<SiteListingState> {
  const listings = await getSiteListings();
  return resolveSiteListings(listings, productId, globalActive);
}
