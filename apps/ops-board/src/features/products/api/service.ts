// ============================================================
// Product Service — Data Access Layer
// ============================================================
// Pattern 2 (Route Handlers + data layer): every function calls the
// `/api/products` route handlers, which read/write the real vape catalog
// via `@/lib/catalog` (master `sites/vape-europe/data/products.json`
// merged with local overrides in `ops-v2/data/catalog-override.json`).
//
// The same functions run in two environments:
//   - Server Components (React Query `prefetchQuery`) → absolute URL via
//     `next/headers` host
//   - Client Components (`useSuspenseQuery` / mutations) → relative URL
// ============================================================

import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload,
  SiteListingPayload,
  SiteListingResponse
} from './types';

async function baseUrl(): Promise<string> {
  if (typeof window !== 'undefined') return '';
  try {
    const { headers } = await import('next/headers');
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) return `${h.get('x-forwarded-proto') ?? 'http'}://${host}`;
  } catch {
    // Not in a request context (e.g. build) — fall through to env default.
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3100}`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${await baseUrl()}/api/products${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init
  });
  if (!res.ok) {
    throw new Error(`Products API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const qs = new URLSearchParams();
  if (filters.page) qs.set('page', String(filters.page));
  if (filters.limit) qs.set('limit', String(filters.limit));
  if (filters.categories) qs.set('categories', filters.categories);
  if (filters.search) qs.set('search', filters.search);
  if (filters.sort) qs.set('sort', filters.sort);
  if (filters.status) qs.set('status', filters.status);
  const query = qs.toString();
  return api<ProductsResponse>(query ? `?${query}` : '');
}

export async function getProductById(id: string): Promise<ProductByIdResponse> {
  return api<ProductByIdResponse>(`/${encodeURIComponent(id)}`);
}

export async function createProduct(data: ProductMutationPayload) {
  return api<{ success: boolean; message: string }>('', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateProduct(id: string, data: ProductMutationPayload) {
  return api<{ success: boolean; message: string }>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteProduct(id: string) {
  return api<{ success: boolean; message: string }>(`/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

/** 单站上下架：把某 SKU 在某站（dubai/gulf/europe）设为上/下架。 */
export async function setSiteListing(payload: SiteListingPayload) {
  return api<SiteListingResponse>('/site-listing', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
