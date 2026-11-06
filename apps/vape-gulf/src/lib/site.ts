/**
 * Central market config — Saudi Arabia / GCC wholesale site.
 * Single source of truth for brand, contact, currency and market copy.
 * Base product pricing is EUR; displayed prices convert via FX_EUR.
 */
export const SITE = {
  /** Machine key used by the ops pipeline (feishu lead ingestion). */
  siteKey: "gulf" as const,
  name: "GulfVape Trading",
  shortName: "GulfVape",
  domain: "https://saudivapesupplier.com",
  email: "sales@saudivapesupplier.com",
  phoneDisplay: "+966 11 000 0000",
  phoneHref: "+966110000000",
  whatsapp: "966500000000", // wa.me number, digits only — replace with live line
  whatsappText: "Hi GulfVape, I'm interested in wholesale pricing",

  /** Display currency + conversion from EUR base prices. */
  currency: "SAR" as const,
  fxFromEur: 4.05,
  intlLocale: "en-SA",

  /** Market geography */
  regionLabel: "Saudi Arabia · GCC",
  defaultCountry: "SA",
  warehouseLine: "Riyadh bonded warehouse — Jeddah & Dammam cross-dock",
  shippingLine: "2-3 days KSA · 3-5 days across the GCC",
  complianceLine: "SFDA / SASO conforming stock · Excise-stamped · 18+",

  /** Sample box headline price (in display currency units). */
  sampleBoxPrice: "SAR 399",
  /** Catalog scale — keep in sync with data/products.json stats. */
  brandsCount: 14,
  skusCount: 79,
  flavorsCount: 226,

  privateLabelMoq: "1,000",

  /** Legal copy — jurisdiction + fulfilment location (terms/privacy). */
  legalJurisdiction: "Riyadh, Kingdom of Saudi Arabia (under Saudi commercial law)",
  legalWarehouse: "our Riyadh bonded warehouse",
} as const;

export function convertFromEur(n: number): number {
  return n * SITE.fxFromEur;
}

export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat(SITE.intlLocale, {
    style: "currency",
    currency: SITE.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertFromEur(n));
}
