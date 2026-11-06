"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { PRODUCTS_STATS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { TocSpine } from "@/components/site/TocSpine";

/**
 * Europe "Engineering Spec" hero.
 *
 * Left: editorial copy + CTA. Right: a numbered TOC spine (the
 * documentation-as-marketing device). Light, precise, SaaS-grade.
 */
export function SpecHero() {
  const { t } = useLocale();
  return (
    <section className="relative border-b border-border bg-background pt-28 pb-16 sm:pt-32 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
          {/* LEFT */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("hero.chip")}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title.1")}{" "}
              <span className="text-primary">{t("hero.title.2")}</span>{" "}
              {t("hero.title.3")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.body", {
                skus: PRODUCTS_STATS.total_products,
                flavors: PRODUCTS_STATS.unique_flavors_estimate,
              })}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="xl" className="rounded-full">
                <Link href="/wholesale">
                  {t("hero.cta.sample")}
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="rounded-full">
                <Link href="/products">{t("hero.cta.browse")}</Link>
              </Button>
            </div>
          </div>

          {/* RIGHT — TOC spine in a bordered "panel" */}
          <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
            <TocSpine />
          </div>
        </div>
      </div>
    </section>
  );
}
