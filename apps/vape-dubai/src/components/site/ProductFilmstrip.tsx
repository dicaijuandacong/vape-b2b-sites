"use client";

import * as React from "react";
import Link from "next/link";
import { getFeaturedProducts, PRODUCTS_STATS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Signature of the Dubai "neon editorial night" design.
 *
 * A horizontal filmstrip of flagship SKUs (snap-scroll), replacing the
 * repeated 3-card grid. Scroll arrows appear on hover; the strip itself
 * is keyboard/touch scrollable. Each card is a neon-edged tile.
 */
export function ProductFilmstrip() {
  const { t } = useLocale();
  const scroller = React.useRef<HTMLDivElement>(null);

  const products = React.useMemo(() => getFeaturedProducts().slice(0, 8), []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Flagship filmstrip"
      className="group relative overflow-hidden border-y border-border bg-background py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {t("filmstrip.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("filmstrip.title")}
            </h2>
          </div>
          {/* hover-revealed scroll arrows */}
          <div className="hidden gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll filmstrip back"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll filmstrip forward"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* edge-faded horizontal scroller */}
      <div className="filmstrip-fade relative">
        <div
          ref={scroller}
          className="filmstrip-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8"
        >
          {products.map((p) => {
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="filmstrip-card group/card relative flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 sm:w-[280px]"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/generated/brand-${p.brand.toLowerCase()}.png`}
                    alt={p.model}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    loading="lazy"
                  />
                  <span className="absolute start-2 top-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary backdrop-blur">
                    {p.brand}
                  </span>
                </div>
                <div className="mt-3 flex flex-1 flex-col px-0.5">
                  <div className="truncate font-display text-sm font-semibold text-foreground">
                    {p.model}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.puffs ? `${(p.puffs / 1000).toFixed(0)}K puffs` : "—"}
                    {" · "}
                    {p.flavors.length} flavors
                  </div>
                  <div className="mt-auto pt-3 text-sm font-semibold text-primary">
                    <QuoteLabel />
                  </div>
                </div>
              </Link>
            );
          })}
          {/* trailing "view all" tile */}
          <Link
            href="/products"
            className="flex w-[200px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border text-center transition-colors hover:border-primary hover:text-primary"
          >
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
              {t("filmstrip.all", {
                skus: PRODUCTS_STATS.total_products,
              })}
            </span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
