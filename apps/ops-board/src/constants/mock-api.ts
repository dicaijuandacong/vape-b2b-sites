////////////////////////////////////////////////////////////////////////////////
// Shared product types + misc helpers.
// The old faker-based in-memory store was replaced by the real vape catalog
// data layer in `@/lib/catalog` (see `src/features/products/api/service.ts`).
////////////////////////////////////////////////////////////////////////////////

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wholesale price tier: minimum order quantity → unit price (EUR). */
export type PriceTier = {
  moq: number;
  price_eur: number;
};

// Vape SKU shape used across the ops dashboard.
// `name` mirrors `model` and `price` mirrors `tiers[0].price_eur` so the
// original table/form plumbing keeps working.
export type Product = {
  /** Catalog slug, e.g. `vozol-star-6000`. */
  id: string;
  /** Mirrors `model`. */
  name: string;
  description: string;
  created_at: string;
  /** Mirrors `tiers[0].price_eur` (EUR). */
  price: number;
  photo_url: string;
  category: string;
  updated_at: string;

  brand: string;
  model: string;
  puffs: number;
  flavors: string[];
  tiers: PriceTier[];
  /** Soft-delete flag — inactive SKUs are 下架'd, never removed. */
  active: boolean;
  /**
   * 单站上下架有效状态（dubai / gulf / europe → bool）。
   * 站点覆盖优先于全局 active；由 `@/lib/catalog` 合并 `data/site-listings.json` 得出。
   */
  site_listings?: Record<string, boolean>;
};
