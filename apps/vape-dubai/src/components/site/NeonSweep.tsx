"use client";

import { PRODUCTS_STATS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { CountUp } from "@/components/fx/CountUp";

/**
 * Replaces the old spinning LiveAuctionsRing divider. A horizontal neon
 * line with a slow light-sweep, sitting above a clean stats row.
 *
 * Server-renderable wrapper; the inner <Stats/> is a client island so
 * CountUp can animate.
 */
export function NeonSweep() {
  return (
    <section
      aria-label="Operational stats"
      className="relative isolate overflow-hidden border-y border-border bg-card/50 py-14 sm:py-16"
    >
      {/* top neon sweep line */}
      <div aria-hidden className="neon-sweep-line absolute inset-x-0 top-0 h-px" />
      <div aria-hidden className="neon-sweep-line absolute inset-x-0 bottom-0 h-px" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Stats />
      </div>
    </section>
  );
}

function Stats() {
  const { t } = useLocale();
  const items = [
    { value: <CountUp to={PRODUCTS_STATS.total_brands} />, label: t("sweep.brands") },
    { value: <CountUp to={PRODUCTS_STATS.total_products} />, label: t("sweep.skus") },
    { value: "1d", label: t("sweep.delivery") },
    { value: "6", label: t("sweep.gcc") },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="text-center sm:text-start">
          <div className="font-display text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
            {s.value}
          </div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
