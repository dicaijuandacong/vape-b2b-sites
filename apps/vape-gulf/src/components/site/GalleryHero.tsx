"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { getProduct } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import { RevealOnScroll } from "@/components/fx/RevealOnScroll";

/**
 * Saudi "Luxury Gallery" hero.
 *
 * Centered serif display (Marcellus), a large faint "01" chapter mark,
 * generous whitespace, a single hero product revealed slowly, and gold
 * 1px hairlines top/bottom. Deliberately unlike the neon/tech sisters.
 */
export function GalleryHero() {
  const { t } = useLocale();
  const found = getProduct("razzbar-65k");
  const product = found?.product;

  return (
    <section
      className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28"
      aria-label="GulfVape gallery hero"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {/* top gold hairline */}
        <div aria-hidden className="mx-auto mb-14 h-px w-24 bg-primary/60" />

        {/* chapter mark */}
        <div className="mb-6 font-display text-7xl font-thin tracking-tight text-primary/15 sm:text-8xl">
          01
        </div>

        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("gallery.chapter.01")}
        </p>

        <h1 className="font-display text-4xl font-normal leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          {t("hero.title.1")}{" "}
          <span className="text-primary">{t("hero.title.2")}</span>
        </h1>
        <h2 className="mt-3 font-display text-4xl font-normal leading-[1.1] tracking-tight text-foreground sm:text-6xl">
          {t("hero.title.3")}
        </h2>

        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("hero.body")}
        </p>

        {/* single hero product, slow reveal */}
        <RevealOnScroll delay={150} className="mt-14">
          <div className="group relative mx-auto max-w-sm">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card">
              <div className="relative aspect-[4/5] bg-gradient-to-b from-primary/5 to-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/generated/brand-${(product?.brand ?? "razzbar").toLowerCase()}.png`}
                  alt={product?.model ?? "Featured"}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              {/* gold corner accent */}
              <div aria-hidden className="absolute end-3 top-3 h-10 w-10 border-e border-t border-primary/50" />
              <div aria-hidden className="absolute start-3 bottom-16 h-10 w-10 border-b border-s border-primary/50" />
            </div>

            {/* caption plaque */}
            <div className="mx-auto mt-6 max-w-xs rounded-xl border border-primary/15 bg-background/60 px-6 py-4 backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {t("gallery.featured")}
              </div>
              <div className="mt-1 font-display text-lg text-foreground">
                {product?.model ?? "Featured"}
              </div>
              <div className="mt-2 font-display text-2xl text-primary">
                <QuoteLabel />
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="xl" className="rounded-full">
            <Link href="/wholesale">
              {t("hero.cta.sample")}
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline" className="rounded-full border-primary/30">
            <Link href="/brands">{t("hero.cta.browse")}</Link>
          </Button>
        </div>

        {/* bottom gold hairline */}
        <div aria-hidden className="mx-auto mt-20 h-px w-24 bg-primary/60" />
      </div>
    </section>
  );
}
