"use client";

import Link from "next/link";
import { PRODUCTS_STATS, BRANDS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import { SectionNumber } from "@/components/site/SectionNumber";
import { ArrowRightIcon } from "@/components/icons";

/**
 * Europe "Engineering Spec" signature.
 *
 * An asymmetric bento of tiles — catalog, compliance, pricing, logistics,
 * brands — replacing the stacked full-width sections. Each tile anchors to
 * a TOC target (#catalog, #compliance, …) so the TocSpine can jump to it.
 */
export function BentoGrid() {
  const { t } = useLocale();

  return (
    <section className="border-b border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 12-col asymmetric bento */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
          {/* Catalog — big tile */}
          <Tile id="catalog" className="md:col-span-4 lg:col-span-7 lg:row-span-2" tint="primary">
            <SectionNumber n="01">{t("toc.catalog")}</SectionNumber>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {PRODUCTS_STATS.total_products} {t("bento.catalog.h")}
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("bento.catalog.body")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {BRANDS.slice(0, 6).map((b) => (
                <span key={b.id} className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground">
                  {b.name}
                </span>
              ))}
            </div>
            <TileLink href="/products">{t("bento.openCatalog")}</TileLink>
          </Tile>

          {/* Compliance */}
          <Tile id="compliance" className="md:col-span-2 lg:col-span-5">
            <SectionNumber n="02">{t("toc.compliance")}</SectionNumber>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{t("bento.compliance.h")}</h3>
            <ul className="mt-3 space-y-1.5 font-mono text-xs text-muted-foreground">
              <li>· TPD / EU-TPD notified</li>
              <li>· MHRA (UK) notified</li>
              <li>· EU-CEG submissions</li>
              <li>· 18+ · child-resist. packaging</li>
            </ul>
            <TileLink href="/compliance">{t("bento.viewPosture")}</TileLink>
          </Tile>

          {/* Pricing */}
          <Tile id="pricing" className="md:col-span-3 lg:col-span-5" tint="primary">
            <SectionNumber n="03">{t("toc.pricing")}</SectionNumber>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{t("bento.pricing.h")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("bento.pricing.body")}</p>
            <div className="mt-4 font-mono text-sm text-foreground">
              <span className="text-2xl font-semibold text-primary">
                <QuoteLabel />
              </span>
            </div>
            <TileLink href="/wholesale#pricing">{t("bento.seeTiers")}</TileLink>
          </Tile>

          {/* Logistics */}
          <Tile id="logistics" className="md:col-span-3 lg:col-span-7">
            <SectionNumber n="04">{t("toc.logistics")}</SectionNumber>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{t("bento.logistics.h")}</h3>
            <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
              <Stat label={t("bento.logistics.wh")} value="NL · DE" />
              <Stat label={t("bento.logistics.lead")} value="5–7d" />
              <Stat label={t("bento.logistics.ship")} value="DDP" />
            </div>
            <TileLink href="/wholesale#shipping">{t("bento.logistics.cta")}</TileLink>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  id,
  children,
  className = "",
  tint = "default",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  tint?: "default" | "primary";
}) {
  return (
    <div
      id={id}
      className={`bento-tile relative flex scroll-mt-24 flex-col overflow-hidden rounded-2xl border p-6 sm:p-7 ${
        tint === "primary"
          ? "border-primary/20 bg-primary/[0.03]"
          : "border-border bg-card/50"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function TileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-primary"
    >
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
