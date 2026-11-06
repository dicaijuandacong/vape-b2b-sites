// ============================================================
// Vape catalog data layer (Node.js / server only)
// ============================================================
// Reads the master catalog shared by the three live sites
// (`../sites/vape-europe/data/products.json` — identical copies live in
// vape-dubai and vape-gulf) and flattens it into the ops `Product` shape.
//
// All mutations (create / update / soft-delete) are persisted to a LOCAL
// override file at `ops-v2/data/catalog-override.json` — the site repos are
// never touched from here. The merged view (master + override) is what the
// dashboard lists.
//
// NOTE: a later step will sync `data/catalog-override.json` back into the 3
// site repos and trigger rebuilds. For now this dashboard is the only
// consumer of the override file.
//
// This module uses `node:fs` — only import it from Route Handlers or Server
// Components (`export const runtime = 'nodejs'`).
// ============================================================

import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PriceTier, Product } from '@/constants/mock-api';
import { getSiteListings, setSiteListing } from '@/lib/site-listings';
import { kvGet, kvSet } from './bitable-kv';
import {
  resolveSiteListings,
  type ListingSite,
  type SiteListingMap
} from '@/lib/site-listing-shared';

// ---------- File locations ----------

// Prefer the bundled copy (works on Vercel, where ../sites doesn't exist);
// fall back to the sibling sites repo for local dev where it may be fresher.
const BUNDLED_PATH = path.resolve(process.cwd(), 'data', 'catalog', 'products.json');
const SIBLING_PATH = path.resolve(
  process.cwd(),
  '..',
  'sites',
  'vape-europe',
  'data',
  'products.json'
);

const MASTER_PATH = process.env.VAPE_CATALOG_PATH ?? BUNDLED_PATH;

const OVERRIDE_PATH = path.resolve(process.cwd(), 'data', 'catalog-override.json');

const GENERATED_DIR = path.resolve(process.cwd(), 'public', 'generated');

const PLACEHOLDER_PHOTO = '/generated/placeholder.png';

/** Resolve the master catalog path: bundled copy first, then sibling sites repo. */
async function resolveMasterPath(): Promise<string> {
  if (process.env.VAPE_CATALOG_PATH) return process.env.VAPE_CATALOG_PATH;
  try {
    await fs.access(BUNDLED_PATH);
    return BUNDLED_PATH;
  } catch {
    return SIBLING_PATH; // local dev fallback
  }
}

// ---------- Raw file shapes ----------

interface MasterSku {
  id: string;
  brand: string;
  model: string;
  puffs: number;
  flavors?: string[];
  tiers?: PriceTier[];
  category?: string;
  source_page?: string;
  confidence?: string;
}

interface MasterCatalogFile {
  _meta?: { generated_at?: string };
  brands: Array<{ id: string; name: string; products: MasterSku[] }>;
}

/** One override record per SKU id. Presence = override of the master row
 *  with the same id, or a brand-new SKU when the id is not in master. */
interface OverrideRecord {
  brand: string;
  model: string;
  puffs: number;
  flavors: string[];
  tiers: PriceTier[];
  category: string;
  description?: string;
  source_page?: string;
  confidence?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface OverrideFile {
  version: 1;
  products: Record<string, OverrideRecord>;
}

/** Fully merged SKU (master row with override applied). */
export interface CatalogEntry extends OverrideRecord {
  id: string;
}

export interface CatalogListFilters {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
  status?: string;
}

// ---------- Override persistence ----------
// 优先飞书 ops_kv（生产持久化，serverless 部署不丢），回退本地文件（开发）。

const OVERRIDE_KV_KEY = 'catalog_override';

async function readOverrideFile(): Promise<OverrideFile> {
  const remote = await kvGet<OverrideFile>(OVERRIDE_KV_KEY);
  if (remote?.products && typeof remote.products === 'object') {
    return remote;
  }
  try {
    const raw = await fs.readFile(OVERRIDE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as OverrideFile;
    if (!parsed.products || typeof parsed.products !== 'object') {
      return { version: 1, products: {} };
    }
    return parsed;
  } catch {
    // Missing or corrupt file — start from an empty override.
    return { version: 1, products: {} };
  }
}

async function writeOverrideFile(data: OverrideFile): Promise<void> {
  const result = await kvSet(OVERRIDE_KV_KEY, data);
  if (result === 'failed') {
    // 生产持久化失败 —— 必须让调用方/运营知道，否则改动静默丢失。
    throw new Error('产品改动写入飞书失败，未保存，请重试');
  }
  try {
    await fs.mkdir(path.dirname(OVERRIDE_PATH), { recursive: true });
    await fs.writeFile(OVERRIDE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch {
    /* 本地缓存写失败不影响 —— 生产环境以飞书为准 */
  }
}

// ---------- Master read + merge ----------

async function readMasterEntries(): Promise<CatalogEntry[]> {
  const masterPath = await resolveMasterPath();
  const raw = await fs.readFile(masterPath, 'utf8');
  const master = JSON.parse(raw) as MasterCatalogFile;
  const stamp = master._meta?.generated_at ?? new Date().toISOString();

  const entries: CatalogEntry[] = [];
  const seenIds = new Set<string>();
  for (const brand of master.brands ?? []) {
    for (const sku of brand.products ?? []) {
      // The master file has one duplicate id (`vapme-crystal-48k`, two
      // distinct rows). Disambiguate with a numeric suffix so every SKU
      // stays addressable.
      let id = sku.id;
      let n = 2;
      while (seenIds.has(id)) {
        id = `${sku.id}-${n++}`;
      }
      seenIds.add(id);
      entries.push({
        id,
        brand: sku.brand ?? brand.name,
        model: sku.model,
        puffs: sku.puffs ?? 0,
        flavors: sku.flavors ?? [],
        tiers: sku.tiers ?? [],
        category: sku.category ?? 'uncategorized',
        source_page: sku.source_page,
        confidence: sku.confidence,
        active: true,
        created_at: stamp,
        updated_at: stamp
      });
    }
  }
  return entries;
}

/** Master catalog + override file merged. Override rows win by id;
 *  override ids missing from master are appended as new SKUs. */
export async function getCatalogEntries(): Promise<CatalogEntry[]> {
  const [master, override] = await Promise.all([readMasterEntries(), readOverrideFile()]);

  const byId = new Map<string, CatalogEntry>();
  for (const entry of master) {
    const patch = override.products[entry.id];
    byId.set(entry.id, patch ? { ...entry, ...patch, id: entry.id } : entry);
  }
  for (const [id, record] of Object.entries(override.products)) {
    if (!byId.has(id)) {
      byId.set(id, { ...record, id });
    }
  }
  return [...byId.values()];
}

// ---------- Mapping to the ops Product shape ----------

const photoCache = new Map<string, string>();

async function resolvePhoto(id: string): Promise<string> {
  const cached = photoCache.get(id);
  if (cached) return cached;

  const rel = `/generated/product-${id}.png`;
  let photo = PLACEHOLDER_PHOTO;
  try {
    await fs.access(path.join(GENERATED_DIR, `product-${id}.png`));
    photo = rel;
  } catch {
    // No generated image for this SKU — fall back to the placeholder.
  }
  photoCache.set(id, photo);
  return photo;
}

function deriveDescription(entry: CatalogEntry): string {
  return (
    entry.description ??
    `${entry.brand} ${entry.model} — ${entry.puffs} puffs, ${entry.flavors.length} flavors.`
  );
}

async function toProduct(entry: CatalogEntry, listings: SiteListingMap = {}): Promise<Product> {
  return {
    id: entry.id,
    name: entry.model,
    description: deriveDescription(entry),
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    price: entry.tiers[0]?.price_eur ?? 0,
    photo_url: await resolvePhoto(entry.id),
    category: entry.category,
    brand: entry.brand,
    model: entry.model,
    puffs: entry.puffs,
    flavors: entry.flavors,
    tiers: entry.tiers,
    active: entry.active,
    site_listings: resolveSiteListings(listings, entry.id, entry.active)
  };
}

// ---------- Query helpers ----------

function matchesStatus(entry: CatalogEntry, status?: string): boolean {
  // Default: hide soft-deleted SKUs. 'all' or 'active,inactive' shows both.
  if (!status) return entry.active;
  const wanted = status
    .split(/[.,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (wanted.length === 0 || wanted.includes('all')) return true;
  const key = entry.active ? 'active' : 'inactive';
  return wanted.includes(key);
}

function matchesSearch(entry: CatalogEntry, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  if (entry.brand.toLowerCase().includes(q)) return true;
  if (entry.model.toLowerCase().includes(q)) return true;
  if (entry.category.toLowerCase().includes(q)) return true;
  return entry.flavors.some((f) => f.toLowerCase().includes(q));
}

function sortEntries(entries: CatalogEntry[], sort?: string): CatalogEntry[] {
  if (!sort) return entries;
  try {
    const sortItems = JSON.parse(sort) as { id: string; desc: boolean }[];
    if (sortItems.length === 0) return entries;
    const { id, desc } = sortItems[0];
    const key = id === 'name' ? 'model' : id === 'price' ? '__price' : id;
    return [...entries].sort((a, b) => {
      const ra = a as unknown as Record<string, unknown>;
      const rb = b as unknown as Record<string, unknown>;
      const aVal = key === '__price' ? (a.tiers[0]?.price_eur ?? 0) : ra[key];
      const bVal = key === '__price' ? (b.tiers[0]?.price_eur ?? 0) : rb[key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return desc ? bVal - aVal : aVal - bVal;
      }
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
    });
  } catch {
    // Invalid sort param — ignore.
    return entries;
  }
}

// ---------- Public API (consumed by route handlers) ----------

export async function listProducts(filters: CatalogListFilters = {}) {
  const { page = 1, limit = 10, categories, search, sort, status } = filters;

  let entries = await getCatalogEntries();

  entries = entries.filter((e) => matchesStatus(e, status));

  const categoriesArray = categories ? String(categories).split(/[.,]/).filter(Boolean) : [];
  if (categoriesArray.length > 0) {
    entries = entries.filter((e) => categoriesArray.includes(e.category));
  }

  if (search) {
    entries = entries.filter((e) => matchesSearch(e, search));
  }

  entries = sortEntries(entries, sort);

  const total = entries.length;
  const offset = (page - 1) * limit;
  const pageEntries = entries.slice(offset, offset + limit);
  const listings = await getSiteListings();

  return {
    success: true,
    time: new Date().toISOString(),
    message: 'Live vape catalog (master + local overrides)',
    total_products: total,
    offset,
    limit,
    products: await Promise.all(pageEntries.map((e) => toProduct(e, listings)))
  };
}

export async function findProductById(id: string) {
  const entries = await getCatalogEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) {
    return { success: false as const, message: `Product with ID ${id} not found` };
  }
  const listings = await getSiteListings();
  return {
    success: true as const,
    time: new Date().toISOString(),
    message: `Product with ID ${id} found`,
    product: await toProduct(entry, listings)
  };
}

export interface CatalogMutationInput {
  brand: string;
  model: string;
  puffs: number;
  category: string;
  description?: string;
  flavors: string[];
  tiers: PriceTier[];
  active: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createCatalogProduct(input: CatalogMutationInput) {
  const override = await readOverrideFile();
  const existing = await getCatalogEntries();

  const base = slugify(`${input.brand} ${input.model}`) || `sku-${Date.now()}`;
  let id = base;
  let n = 2;
  while (existing.some((e) => e.id === id)) {
    id = `${base}-${n++}`;
  }

  const now = new Date().toISOString();
  const record: OverrideRecord = {
    brand: input.brand,
    model: input.model,
    puffs: input.puffs,
    flavors: input.flavors,
    tiers: input.tiers,
    category: input.category,
    ...(input.description ? { description: input.description } : {}),
    active: input.active,
    created_at: now,
    updated_at: now
  };

  override.products[id] = record;
  await writeOverrideFile(override);

  const listings = await getSiteListings();
  return {
    success: true as const,
    message: 'Product created successfully',
    product: await toProduct({ ...record, id }, listings)
  };
}

export async function updateCatalogProduct(id: string, input: CatalogMutationInput) {
  const entries = await getCatalogEntries();
  const current = entries.find((e) => e.id === id);
  if (!current) {
    return { success: false as const, message: `Product with ID ${id} not found` };
  }

  const record: OverrideRecord = {
    brand: input.brand,
    model: input.model,
    puffs: input.puffs,
    flavors: input.flavors,
    tiers: input.tiers,
    category: input.category,
    ...(input.description ? { description: input.description } : {}),
    ...(current.source_page ? { source_page: current.source_page } : {}),
    ...(current.confidence ? { confidence: current.confidence } : {}),
    active: input.active,
    created_at: current.created_at,
    updated_at: new Date().toISOString()
  };

  const override = await readOverrideFile();
  override.products[id] = record;
  await writeOverrideFile(override);

  const listings = await getSiteListings();
  return {
    success: true as const,
    message: 'Product updated successfully',
    product: await toProduct({ ...record, id }, listings)
  };
}

/** Soft delete — the SKU stays in the catalog with `active: false` (下架). */
export async function deleteCatalogProduct(id: string) {
  const entries = await getCatalogEntries();
  const current = entries.find((e) => e.id === id);
  if (!current) {
    return { success: false as const, message: `Product with ID ${id} not found` };
  }

  const record: OverrideRecord = {
    brand: current.brand,
    model: current.model,
    puffs: current.puffs,
    flavors: current.flavors,
    tiers: current.tiers,
    category: current.category,
    ...(current.description ? { description: current.description } : {}),
    ...(current.source_page ? { source_page: current.source_page } : {}),
    ...(current.confidence ? { confidence: current.confidence } : {}),
    active: false,
    created_at: current.created_at,
    updated_at: new Date().toISOString()
  };

  const override = await readOverrideFile();
  override.products[id] = record;
  await writeOverrideFile(override);

  return { success: true as const, message: 'Product deactivated (soft delete)' };
}

// ---------- Per-site listing (单站上下架) ----------

/**
 * Set the per-site listing state for a SKU. The override is additive on top
 * of the global `active` flag: a site with no override inherits `active`.
 * Returns the updated effective per-site states.
 */
export async function setCatalogSiteListing(id: string, site: ListingSite, listed: boolean) {
  const entries = await getCatalogEntries();
  const current = entries.find((e) => e.id === id);
  if (!current) {
    return { success: false as const, message: `Product with ID ${id} not found` };
  }

  const siteListings = await setSiteListing(id, site, listed, current.active);

  return {
    success: true as const,
    message: listed ? '已上架' : '已下架',
    site_listings: siteListings
  };
}
