export type { Product, PriceTier } from '@/constants/mock-api';
export type { ListingSite, SiteListingState } from '@/lib/site-listing-shared';

export type ProductFilters = {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
  /**
   * 'active' (default) | 'inactive' | 'all' | comma-separated mix
   * ('active,inactive' = all). Inactive SKUs are soft-deleted (下架).
   */
  status?: string;
};

export type ProductsResponse = {
  success: boolean;
  time: string;
  message: string;
  total_products: number;
  offset: number;
  limit: number;
  products: import('@/constants/mock-api').Product[];
};

export type ProductByIdResponse = {
  success: boolean;
  time: string;
  message: string;
  product: import('@/constants/mock-api').Product;
};

export type ProductMutationPayload = {
  /** Kept for compatibility — always equal to `model`. */
  name: string;
  brand: string;
  model: string;
  puffs: number;
  category: string;
  /** Convenience mirror of `tiers[0].price_eur`. */
  price: number;
  description: string;
  flavors: string[];
  tiers: import('@/constants/mock-api').PriceTier[];
  active: boolean;
};

/** 单站上下架 mutation 入参。 */
export type SiteListingPayload = {
  productId: string;
  site: import('@/lib/site-listing-shared').ListingSite;
  listed: boolean;
};

export type SiteListingResponse = {
  success: boolean;
  message: string;
  site_listings?: import('@/lib/site-listing-shared').SiteListingState;
};
