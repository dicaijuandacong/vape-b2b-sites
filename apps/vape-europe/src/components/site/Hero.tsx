"use client";

import Link from "next/link";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { PRODUCTS_STATS, BRANDS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { CountUp } from "@/components/fx/CountUp";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { HeroParticles } from "@/components/fx/HeroParticles";

export function Hero() {
  const { t } = useLocale();
  return (
    <section
      className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28"
      aria-label="EuroVape Supply hero"
    >
      <div className="absolute inset-0 -z-10 bg-background" />

      {/* Animated mesh — 3 lime blobs drifting slowly */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="mesh-blob-a absolute left-[8%] top-[15%] h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #2563EB, transparent)" }}
        />
        <div
          className="mesh-blob-b absolute right-[5%] top-[35%] h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #1D4ED8, transparent)" }}
        />
        <div
          className="mesh-blob-c absolute left-[40%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #DBEAFE, transparent)" }}
        />
      </div>

      {/* Floating particles */}
      <HeroParticles count={10} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* LEFT — copy with stagger entry */}
          <div>
            <div
              className="hero-stagger mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
              style={{ ["--i" as string]: 0 }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {t("hero.chip")}
            </div>
            <h1
              className="hero-stagger font-display text-[3rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[4.75rem]"
              style={{ ["--i" as string]: 1 }}
            >
              {t("hero.title.1")}
              <br />
              {t("hero.title.2")}
              <br />
              <span className="headline-sweep inline-block">{t("hero.title.3")}</span>
            </h1>
            <p
              className="hero-stagger mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
              style={{ ["--i" as string]: 2 }}
            >
              {t("hero.body", {
                skus: PRODUCTS_STATS.total_products,
                flavors: PRODUCTS_STATS.unique_flavors_estimate,
              })}
            </p>

            <dl
              className="hero-stagger mt-10 grid max-w-md grid-cols-3 gap-2 sm:gap-6"
              style={{ ["--i" as string]: 3 }}
            >
              <StatAnim label={t("hero.stat.brands")} to={PRODUCTS_STATS.total_brands} />
              <StatAnim label={t("hero.stat.skus")} to={PRODUCTS_STATS.total_products} />
              <StatAnim label={t("hero.stat.flavors")} to={PRODUCTS_STATS.unique_flavors_estimate} suffix="+" />
            </dl>

            <div
              className="hero-stagger mt-10 flex flex-wrap items-center gap-3"
              style={{ ["--i" as string]: 4 }}
            >
              <MagneticButton>
                <Button asChild size="xl" className="rounded-full">
                  <Link href="/wholesale">
                    {t("hero.cta.sample")}
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </MagneticButton>
              <MagneticButton>
                <Button asChild size="xl" variant="outline" className="rounded-full border-foreground/15">
                  <Link href="/brands">{t("hero.cta.browse")}</Link>
                </Button>
              </MagneticButton>
            </div>
          </div>

          {/* RIGHT — clean 4-card stack with breathing room */}
          <div className="relative">
            <CardWall />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatAnim({ label, to, suffix = "" }: { label: string; to: number; suffix?: string }) {
  return (
    <div>
      <dd className="font-display text-3xl font-semibold leading-none text-foreground sm:text-4xl">
        <CountUp to={to} suffix={suffix} />
      </dd>
      <dt className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
    </div>
  );
}

/**
 * 4 product cards in a relaxed 2x2 staggered layout — less crowded than 5 cards.
 * Top-right card carries the LIVE badge.
 */
function CardWall() {
  const picks = BRANDS.slice(0, 4);
  const slots = [
    { rotate: "rotate-[-5deg]", translate: "translate-y-3",      z: "z-20" },
    { rotate: "rotate-[4deg]",  translate: "-translate-y-2",     z: "z-30" },
    { rotate: "rotate-[-3deg]", translate: "translate-y-2",      z: "z-10" },
    { rotate: "rotate-[6deg]",  translate: "-translate-y-1",     z: "z-20" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Decorative neon ring (NFT marketplace LIVE AUCTIONS reference) */}
      <div
        aria-hidden
        className="absolute -right-2 -top-2 h-24 w-24 rounded-full border border-primary/40"
        style={{ boxShadow: "inset 0 0 24px -2px rgba(37,99,235,0.25)" }}
      />
      <div
        aria-hidden
        className="absolute -left-4 -bottom-4 h-40 w-40 rounded-full border border-primary/15"
      />

      <div className="absolute inset-0 grid grid-cols-2 gap-4 p-6">
        {slots.map((s, i) => {
          const brand = picks[i];
          if (!brand) return null;
          const sku = brand.products[0];
          return (
            <div
              key={brand.id}
              className={`card-drop relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[0_24px_50px_-25px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:rotate-0 hover:scale-[1.05] hover:shadow-[0_30px_60px_-20px_rgba(37,99,235,0.35)] ${s.rotate} ${s.translate} ${s.z}`}
              style={{ ["--i" as string]: i }}
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {/* Fallback gradient sits underneath; <img> covers it if file exists, otherwise onError hides itself */}
                <CardFallback brandId={brand.id} brandName={brand.name} />
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
                {i === 1 && (
                  <span className="neon-pulse absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
                    Live
                  </span>
                )}
              </div>
              <div className="mt-3 px-0.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {brand.name}
                </div>
                <div className="mt-0.5 truncate font-display text-sm font-semibold">
                  {sku?.model ?? "—"}
                </div>
                <div className="mt-1 text-xs text-primary">
                  <QuoteLabel />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardFallback({ brandId, brandName }: { brandId: string; brandName: string }) {
  const tones: Record<string, string> = {
    vozol:   "from-[#2563EB]/30 to-[#E2E8F0]",
    vapen:   "from-[#1D4ED8]/30 to-[#E2E8F0]",
    waspe:   "from-[#DBEAFE]/30 to-[#E2E8F0]",
    fumot:   "from-[#3B82F6]/30 to-[#E2E8F0]",
    jnr:     "from-[#2563EB]/40 to-[#E2E8F0]",
    razzbar: "from-[#1D4ED8]/30 to-[#E2E8F0]",
    vapme:   "from-[#DBEAFE]/30 to-[#E2E8F0]",
  };
  const grad = tones[brandId] ?? tones.vapen;
  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${grad}`}>
      <div className="absolute inset-x-3 top-3 h-1 rounded-full bg-foreground/40" />
      <div className="absolute left-1/2 top-1/2 h-3/5 w-1/4 -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground/8 ring-1 ring-foreground/20" />
      <div className="absolute inset-x-3 bottom-3 h-1.5 rounded-full bg-primary/60" />
      <div className="absolute right-2 top-2 font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/60">
        {brandName.slice(0, 5)}
      </div>
    </div>
  );
}
