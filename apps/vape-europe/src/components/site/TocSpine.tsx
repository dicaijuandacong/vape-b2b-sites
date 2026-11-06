"use client";

import * as React from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { PRODUCTS_STATS } from "@/lib/data";

type Item = { n: string; key: string; href: string; meta: string };

/**
 * Europe "Engineering Spec" signature.
 *
 * A numbered table-of-contents spine rendered in mono. Clicking an item
 * smooth-scrolls to the matching bento/section anchor. Doubles as the
 * hero's right column and the site's structural "documentation" feel.
 */
export function TocSpine() {
  const { t } = useLocale();
  const items: Item[] = [
    { n: "01", key: "toc.catalog", href: "#catalog", meta: t("toc.catalog.meta", { skus: PRODUCTS_STATS.total_products }) },
    { n: "02", key: "toc.compliance", href: "#compliance", meta: t("toc.compliance.meta") },
    { n: "03", key: "toc.pricing", href: "#pricing", meta: t("toc.pricing.meta") },
    { n: "04", key: "toc.logistics", href: "#logistics", meta: t("toc.logistics.meta") },
  ];

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav aria-label="Contents" className="font-mono text-sm">
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {t("toc.title")}
      </div>
      <ul className="divide-y divide-border">
        {items.map((it) => (
          <li key={it.n}>
            <a
              href={it.href}
              onClick={(e) => go(e, it.href)}
              className="group flex items-center gap-4 py-3 transition-colors hover:text-primary"
            >
              <span className="text-primary">{it.n}</span>
              <span className="flex-1 text-foreground group-hover:text-primary">{t(it.key)}</span>
              <span className="text-[11px] text-muted-foreground">{it.meta}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
