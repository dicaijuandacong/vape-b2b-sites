/**
 * Image asset helper. Returns a path to a generated image if it exists in
 * `public/generated/`, otherwise null (so components can fall back to SVG mock).
 *
 * Implementation: at build time, we read the public/generated directory and
 * cache the list of available slugs. At runtime, components call `genImg(slug)`.
 */

import fs from "node:fs";
import path from "node:path";

// Cache only in production. In dev, re-read so newly generated images appear
// immediately on refresh without restarting the dev server.
let _cache: Set<string> | null = null;
const IS_PROD = process.env.NODE_ENV === "production";

function loadAvailable(): Set<string> {
  if (_cache && IS_PROD) return _cache;
  const dir = path.join(process.cwd(), "public", "generated");
  let next: Set<string>;
  try {
    const files = fs.readdirSync(dir);
    next = new Set(
      files
        .filter((f) => /\.(png|jpe?g|webp|avif)$/i.test(f))
        .map((f) => f.replace(/\.[a-z]+$/i, ""))
    );
  } catch {
    next = new Set();
  }
  if (IS_PROD) _cache = next;
  return next;
}

/**
 * Returns the public path to a generated image if it exists, otherwise null.
 *
 * @example
 *   genImg("hero-main") // → "/generated/hero-main.png" or null
 */
export function genImg(slug: string): string | null {
  const avail = loadAvailable();
  if (!avail.has(slug)) return null;
  // Prefer png by default; could extend to detect format
  const dir = path.join(process.cwd(), "public", "generated");
  for (const ext of ["png", "webp", "jpg", "jpeg", "avif"]) {
    if (fs.existsSync(path.join(dir, `${slug}.${ext}`))) {
      return `/generated/${slug}.${ext}`;
    }
  }
  return null;
}

/** True if a generated image exists for slug. */
export function hasGenImg(slug: string): boolean {
  return loadAvailable().has(slug);
}

/** Brand id → generated image slug mapping. */
export function brandImgSlug(brandId: string): string {
  return `brand-${brandId.toLowerCase()}`;
}

/** Product id → generated image slug mapping. */
export function productImgSlug(productId: string): string {
  return `product-${productId.toLowerCase()}`;
}

/**
 * Convert a flavor name into a kebab-case slug suitable for filenames.
 *   "Watermelon Ice"           → "watermelon-ice"
 *   "Strawberry & Banana"      → "strawberry-banana"
 *   "Mango Peach Watermelon"   → "mango-peach-watermelon"
 *   "Cool Mint (Salt)"         → "cool-mint-salt"
 */
export function flavorSlug(flavor: string): string {
  return flavor
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Product id + flavor → generated image slug. */
export function flavorImgSlug(productId: string, flavor: string): string {
  return `product-${productId.toLowerCase()}-${flavorSlug(flavor)}`;
}

/**
 * Resolve the best available image for a given product + optional flavor.
 * Priority chain:
 *   1. per-flavor image (`product-<id>-<flavor>`)  ← if flavor passed
 *   2. per-SKU image     (`product-<id>`)
 *   3. brand cover       (`brand-<brandId>`)
 *   4. null → caller falls back to its own SVG mock
 */
export function productOrBrandImg(
  productId: string,
  brandId: string,
  flavor?: string
): string | null {
  if (flavor) {
    const f = genImg(flavorImgSlug(productId, flavor));
    if (f) return f;
  }
  return genImg(productImgSlug(productId)) ?? genImg(brandImgSlug(brandId));
}

/** True if a per-flavor image exists for (productId, flavor). */
export function hasFlavorImg(productId: string, flavor: string): boolean {
  return hasGenImg(flavorImgSlug(productId, flavor));
}
