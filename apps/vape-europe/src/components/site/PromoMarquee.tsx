"use client";

import { ArrowRightIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/locale-context";
import { PRODUCTS_STATS } from "@/lib/data";

const KEYS = ["promo.1", "promo.2", "promo.3", "promo.4", "promo.5"] as const;

export function PromoMarquee() {
  const { t } = useLocale();
  // Catalog-scale numbers come from products.json stats — no hardcoded counts.
  const items = KEYS.map((k) =>
    t(k, {
      skus: PRODUCTS_STATS.total_products,
      flavors: PRODUCTS_STATS.unique_flavors_estimate,
    })
  );
  // Duplicate the strip so the CSS animation never shows a gap
  const loop = [...items, ...items, ...items];
  return (
    <div className="relative isolate flex h-10 items-center overflow-hidden border-y border-[#DBEAFE] bg-[#EFF4FB] text-[#1D4ED8]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#EFF4FB] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#EFF4FB] to-transparent" />
      <div
        className="flex shrink-0 items-center gap-12 whitespace-nowrap will-change-transform [animation:marquee_60s_linear_infinite] hover:[animation-play-state:paused]"
      >
        {loop.map((t2, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#2563EB]">
            <ArrowRightIcon className="h-3 w-3 text-primary" />
            <span>{t2}</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
