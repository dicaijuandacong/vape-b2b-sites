import productsData from "../../data/products.json";
import brandsIndex from "../../data/brands.json";
import type { Product, Brand, ProductsFile } from "@/types/product";
import { formatPrice } from "@/lib/site";

const file = productsData as unknown as ProductsFile;

export const PRODUCTS_META = file._meta;
export const PRODUCTS_STATS = file.stats;
export const BRANDS: Brand[] = file.brands;
export const BRAND_INDEX = brandsIndex as { id: string; name: string; tagline: string; slug: string; product_count: number; source_pdf: string }[];

export function getBrand(id: string): Brand | undefined {
  return BRANDS.find((b) => b.id === id);
}

export function getProduct(id: string): { product: Product; brand: Brand } | undefined {
  for (const brand of BRANDS) {
    const product = brand.products.find((p) => p.id === id);
    if (product) return { product, brand };
  }
  return undefined;
}

export function getAllProducts(): Product[] {
  return BRANDS.flatMap((b) => b.products);
}

export function getFeaturedProducts(): Product[] {
  // Hand-picked feature SKUs across the line — large puff count + medium+ confidence
  const ids = [
    "jnr-windwhip-44000",
    "razzbar-65k",
    "vapme-crystal-48k",
    "fumot-tornado-14000",
    "vapme-digital-50k",
    "jnr-magic-vape-45000",
  ];
  return ids
    .map((id) => getProduct(id)?.product)
    .filter((p): p is Product => Boolean(p));
}

export function lowestPrice(p: Product): number | null {
  const valid = p.tiers.map((t) => t.price_eur).filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  return Math.min(...valid);
}

export function highestTierMoq(p: Product): number {
  const valid = p.tiers.map((t) => t.moq);
  if (valid.length === 0) return 0;
  return Math.max(...valid);
}

export function lowestTierMoq(p: Product): number {
  const valid = p.tiers.map((t) => t.moq);
  if (valid.length === 0) return 0;
  return Math.min(...valid);
}

/**
 * Price display — EUR native on this site (fx = 1.0 in site config).
 * Named `formatEur` for historical reasons; `formatPrice` re-exported.
 */
export function formatEur(n: number | null | undefined): string {
  return formatPrice(n);
}

export { formatPrice };
