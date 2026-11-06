/**
 * Central market config — Europe small-B wholesale site.
 * Single source of truth for brand, contact, currency and market copy.
 * Base product pricing is EUR; displayed natively (fx = 1.0).
 */
export const SITE = {
  /** Machine key used by the ops pipeline (feishu lead ingestion). */
  siteKey: "europe" as const,
  name: "EuroVape Supply",
  shortName: "EuroVape",
  domain: "https://europevapesupplier.com",
  email: "sales@europevapesupplier.com",
  phoneDisplay: "+31 20 000 0000",
  phoneHref: "+31200000000",
  whatsapp: "31600000000", // wa.me number, digits only — replace with live line
  whatsappText: "Hi EuroVape, I'm interested in wholesale pricing",

  /** Display currency + conversion from EUR base prices. */
  currency: "EUR" as const,
  fxFromEur: 1.0,
  intlLocale: "en-GB",

  /** Market geography */
  regionLabel: "European Union · UK · EEA",
  defaultCountry: "EU",
  warehouseLine: "Rotterdam (NL) + Frankfurt (DE) — DDP to all member states",
  shippingLine: "DDP shipping from EU warehouse · 5-7 days",
  complianceLine: "TPD / MHRA / EU-CEG notified stock · 18+",

  /** Sample box headline price (in display currency units). */
  sampleBoxPrice: "€99",
  /** Catalog scale — keep in sync with data/products.json stats. */
  brandsCount: 14,
  skusCount: 79,
  flavorsCount: 226,

  privateLabelMoq: "1,000",

  /** Legal copy — jurisdiction + fulfilment location (terms/privacy). */
  legalJurisdiction: "the Netherlands (EU consumer/commercial law where applicable; GDPR for data)",
  legalWarehouse: "our EU warehouse",
} as const;

export function convertFromEur(n: number): number {
  return n * SITE.fxFromEur;
}

export function formatPrice(n: number | null | undefined, locale?: string): string {
  if (n == null) return "—";
  return new Intl.NumberFormat(locale ?? SITE.intlLocale, {
    style: "currency",
    currency: SITE.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertFromEur(n));
}
