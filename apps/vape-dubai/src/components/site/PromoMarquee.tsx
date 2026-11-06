import { ArrowRightIcon } from "@/components/icons";
import { PRODUCTS_STATS } from "@/lib/data";

// Catalog-scale numbers come from products.json stats — no hardcoded counts.
const items = [
  "Wholesale only — vape distributor for Dubai, the UAE & the GCC",
  "Jebel Ali warehouse · Same-day Dubai · 2-4 days across the GCC",
  `14 manufacturer-grade brands · ${PRODUCTS_STATS.total_products} flagship SKUs · ${PRODUCTS_STATS.unique_flavors_estimate}+ flavors`,
  "B2B from 50 units · Tiered pricing · Sample boxes from AED 399",
  "Custom branding & private label · MOQ from 1,000 units",
];

export function PromoMarquee() {
  // Duplicate the strip so the CSS animation never shows a gap
  const loop = [...items, ...items, ...items];
  return (
    <div className="relative isolate flex h-10 items-center overflow-hidden border-y border-border bg-[#000] text-foreground">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />
      <div
        className="flex shrink-0 items-center gap-12 whitespace-nowrap will-change-transform [animation:marquee_60s_linear_infinite] hover:[animation-play-state:paused]"
      >
        {loop.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <ArrowRightIcon className="h-3 w-3 text-primary" />
            <span>{t}</span>
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
