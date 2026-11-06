"use client";

import Link from "next/link";
import { BRANDS, PRODUCTS_STATS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { RevealOnScroll } from "@/components/fx/RevealOnScroll";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Saudi "Luxury Gallery" signature.
 *
 * Brands as a vertical *maison* roster — one row per brand, numbered,
 * separated by gold hairlines. Replaces the 3-card grid with something
 * that reads like a curated luxury catalog index.
 */
export function MaisonList() {
  const { t } = useLocale();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            {t("maison.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("maison.eyebrow")}</p>
        </div>

        <div className="divide-y divide-primary/15 border-y border-primary/15">
          {BRANDS.map((brand, i) => {
            const flavorCount = new Set(
              brand.products.flatMap((p) => p.flavors.map((f) => f.toLowerCase()))
            ).size;
            return (
              <RevealOnScroll key={brand.id} delay={i * 60}>
                <Link
                  href={`/brands/${brand.id}`}
                  className="group flex items-center gap-6 py-7 transition-colors hover:bg-primary/[0.03]"
                >
                  {/* index */}
                  <span className="w-8 shrink-0 font-mono text-xs tracking-widest text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* logo tile */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-primary/20 bg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/generated/brand-${brand.id}.png`}
                      alt={brand.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      loading="lazy"
                    />
                  </div>

                  {/* name + tagline */}
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl text-foreground">{brand.name}</div>
                    <div className="truncate text-sm text-muted-foreground">{brand.tagline}</div>
                  </div>

                  {/* stats */}
                  <div className="hidden shrink-0 text-right sm:block">
                    <div className="font-display text-lg text-primary">{brand.products.length}</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("maison.skus")}
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-right md:block">
                    <div className="font-display text-lg text-foreground">{flavorCount}</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("maison.flavors")}
                    </div>
                  </div>

                  <ArrowRightIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </RevealOnScroll>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {PRODUCTS_STATS.total_products} {t("maison.skus")} · {BRANDS.length} {t("maison.houses")}
        </p>
      </div>
    </section>
  );
}
