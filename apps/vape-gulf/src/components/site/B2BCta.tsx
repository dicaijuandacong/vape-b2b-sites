"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, PackageIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/locale-context";

export function B2BCta() {
  const { t } = useLocale();
  const titleSrc = t("b2b.title");
  const parts = titleSrc.split(", ");
  const head = parts.slice(0, -1).join(", ") + (parts.length > 1 ? ", " : "");
  const tail = parts[parts.length - 1] ?? "";
  return (
    <section className="reveal-on-scroll relative overflow-hidden py-20 sm:py-28">
      {/* Background — pure dark with subtle lime hint */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-background" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(231,197,104,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card/30 p-8 backdrop-blur sm:p-12 lg:p-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div>
              <Badge variant="accent" size="lg" className="mb-5">
                <PackageIcon className="h-3.5 w-3.5" />
                {t("b2b.chip")}
              </Badge>
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {head}<span className="text-gradient-primary">{tail}</span>
              </h2>
              <p className="mt-5 max-w-xl text-base text-muted-foreground">
                {t("b2b.body")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="xl" className="rounded-full">
                  <Link href="/wholesale">
                    {t("b2b.cta.portal")}
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline" className="rounded-full border-foreground/15">
                  <Link href="/wholesale#sample-box">{t("b2b.cta.sample")}</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TILES.map((t) => (
                <div
                  key={t.label}
                  className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur"
                >
                  <div className="font-display text-3xl font-semibold text-foreground">
                    {t.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const TILES = [
  { value: "50+", label: "MOQ for assorted boxes" },
  { value: "1,000+", label: "MOQ for private label" },
  { value: "2-3d", label: "Riyadh warehouse lead time" },
  { value: "7", label: "Manufacturer-grade brands" },
];
