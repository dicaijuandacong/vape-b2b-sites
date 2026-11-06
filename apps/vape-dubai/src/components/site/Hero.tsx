"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { PRODUCTS_STATS, getProduct } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import { CountUp } from "@/components/fx/CountUp";
import { MagneticButton } from "@/components/fx/MagneticButton";
import { HeroParticles } from "@/components/fx/HeroParticles";

export function Hero() {
  const { t } = useLocale();
  return (
    <section
      className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-24 lg:pt-32 lg:pb-28"
      aria-label="DubaiVape Supply hero"
    >
      <div className="absolute inset-0 -z-10 bg-background" />

      {/* Animated neon mesh — 3 drifting blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="mesh-blob-a absolute left-[8%] top-[15%] h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #00FFFF, transparent)" }}
        />
        <div
          className="mesh-blob-b absolute right-[5%] top-[35%] h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #9D4EDD, transparent)" }}
        />
        <div
          className="mesh-blob-c absolute left-[40%] bottom-[10%] h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #B2FFFF, transparent)" }}
        />
      </div>

      <HeroParticles count={10} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* LEFT — editorial copy */}
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

          {/* RIGHT — single floating device + holographic price tag */}
          <div className="relative">
            <FloatingDevice />
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
 * Single flagship device floating against a neon halo, with a tilted
 * holographic price tag. Replaces the old 2×2 card wall — one hero object
 * reads more "product launch" than a grid.
 */
function FloatingDevice() {
  const found = getProduct("jnr-windwhip-44000");
  const flagship = found?.product;
  const { t } = useLocale();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[480px]">
      {/* neon halo rings */}
      <div
        aria-hidden
        className="absolute inset-[8%] rounded-full border border-primary/30"
        style={{ boxShadow: "inset 0 0 60px -10px rgba(0,255,255,0.35), 0 0 80px -20px rgba(0,255,255,0.4)" }}
      />
      <div aria-hidden className="absolute inset-[20%] rounded-full border border-primary/15" />
      <div aria-hidden className="absolute inset-[32%] rounded-full border border-primary/10" />

      {/* the device */}
      <div className="absolute inset-[18%] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(0,255,255,0.45)]">
        <div className="relative h-full w-full bg-gradient-to-br from-primary/15 via-background to-[#160A28]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/generated/brand-jnr.png"
            alt={flagship?.model ?? "Flagship device"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="neon-pulse absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
            Live · Jebel Ali
          </span>
        </div>
      </div>

      {/* holographic price tag */}
      <div
        className="absolute -bottom-2 end-[-4%] w-44 rotate-3 rounded-2xl border border-primary/40 bg-card/80 p-4 backdrop-blur-md"
        style={{ boxShadow: "0 0 40px -12px rgba(0,255,255,0.5)" }}
      >
        <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("hero.tag.flagship")}
        </div>
        <div className="mt-0.5 truncate font-display text-sm font-semibold text-foreground">
          {flagship?.model ?? "Flagship"}
        </div>
        <div className="mt-2 font-display text-xl font-semibold text-primary">
          <QuoteLabel />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {flagship?.puffs ? `${(flagship.puffs / 1000).toFixed(0)}K puffs` : ""} · {flagship?.flavors.length ?? 0} flavors
        </div>
      </div>
    </div>
  );
}
