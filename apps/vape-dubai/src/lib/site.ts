/**
 * Central market config — Dubai / UAE wholesale site.
 * Single source of truth for brand, contact, currency and market copy.
 * Base product pricing is EUR; displayed prices convert via FX_EUR.
 */
export const SITE = {
  /** Machine key used by the ops pipeline (feishu lead ingestion). */
  siteKey: "dubai" as const,
  name: "DubaiVape Supply",
  shortName: "DubaiVape",
  domain: "https://dubaivapesupplier.com",
  email: "sales@dubaivapesupplier.com",
  phoneDisplay: "+971 4 000 0000",
  phoneHref: "+971400000000",
  whatsapp: "971500000000", // wa.me number, digits only — replace with live line
  whatsappText: "Hi DubaiVape, I'm interested in wholesale pricing",

  /** Display currency + conversion from EUR base prices. */
  currency: "AED" as const,
  fxFromEur: 4.0,
  intlLocale: "en-AE",

  /** Market geography */
  regionLabel: "Dubai · UAE · GCC",
  defaultCountry: "AE",
  warehouseLine: "Jebel Ali Free Zone (Dubai, AE) — GCC re-export hub",
  shippingLine: "Same-day Dubai delivery · 2-4 days across the GCC",
  complianceLine: "ESMA / UAE.S 5030:2018 conforming stock · Excise-stamped · 18+",

  /** Sample box headline price (in display currency units). */
  sampleBoxPrice: "AED 399",
  /** Catalog scale — keep in sync with data/products.json stats. */
  brandsCount: 14,
  skusCount: 79,
  flavorsCount: 226,

  privateLabelMoq: "1,000",

  /** Legal copy — jurisdiction + fulfilment location (terms/privacy). */
  legalJurisdiction: "Dubai, United Arab Emirates (governed under the DIFC common-law framework where applicable)",
  legalWarehouse: "our Jebel Ali warehouse",
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
