import type { Brand, Product } from "@/types/product";
import { SITE } from "@/lib/site";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE.domain).replace(/\/$/, "");
const ORG_NAME = SITE.name;
const ORG_EMAIL = SITE.email;

/**
 * Organization schema for the publisher (Vaporforge EU).
 * Use once globally in the root layout.
 */
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "European wholesale vape supplier for independent retailers. TPD / MHRA / EU-CEG notified, 14 manufacturer-grade brands, EU warehouse with DDP shipping. B2B from 50 units.",
    sameAs: [
      "https://www.linkedin.com/company/eurovape-supply",
      "https://www.instagram.com/eurovape.supply",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: ORG_EMAIL,
        contactType: "sales",
        areaServed: "EU",
        availableLanguage: ["en", "nl", "de", "fr"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Rotterdam",
      addressCountry: "NL",
    },
  };
}

/**
 * Brand schema. Includes Brand + a sub-Organization reference back to Vaporforge EU as distributor.
 */
export function brandLd(brand: Brand) {
  const url = `${SITE_URL}/brands/${brand.id}`;
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    "@id": `${url}#brand`,
    name: brand.name,
    description: brand.tagline,
    url,
    slogan: brand.tagline,
    makesOffer: {
      "@type": "AggregateOffer",
      offerCount: brand.products.length,
      priceCurrency: "EUR",
      seller: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: ORG_NAME,
      },
    },
  };
}

/**
 * Product schema. No Offer/price data is emitted — per-SKU pricing is
 * quote-only and must never leak into crawlable structured data.
 */
export function productLd(product: Product, brand: Brand) {
  const url = `${SITE_URL}/products/${product.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: `${product.brand} ${product.model}`,
    description: `${product.brand} ${product.model} — ${product.flavors.length} flavors${
      product.puffs ? `, ${product.puffs.toLocaleString()} puffs` : ""
    }. TPD-notified, EU warehouse, DDP shipping.`,
    sku: product.id,
    category: product.category,
    url,
    brand: {
      "@type": "Brand",
      "@id": `${SITE_URL}/brands/${brand.id}#brand`,
      name: brand.name,
    },
  };
}

export type BreadcrumbItem = { name: string; url: string };

/**
 * BreadcrumbList. Pass items with absolute or root-relative URLs;
 * relative URLs will be resolved against SITE_URL.
 */
export function breadcrumbLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}
