"use client";

import { BoltIcon, PackageIcon, GlobeIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/locale-context";

const REASONS = [
  {
    icon: PackageIcon,
    title: "Fourteen brands. One PO.",
    body: "Mix VOZOL, Vapen, WASPE, FUMOT, JNR, Razzbar and VAPME on a single purchase order. We split the carton, label the manifest, and ship from one Jebel Ali warehouse. Your buyers stop juggling supplier emails.",
  },
  {
    icon: BoltIcon,
    title: "Jebel Ali-stocked. Same-day Dubai.",
    body: "Warehouse in Jebel Ali Free Zone. Excise-stamped, ESMA-conforming stock. Same-day delivery across Dubai, 2-4 days to Riyadh, Doha, Kuwait City and Muscat. Signed manifest on arrival.",
  },
  {
    icon: GlobeIcon,
    title: "Tier pricing that actually scales.",
    body: "Sample box from AED 399. Distributor starter from 200 units, ~35% off RRP. Volume tier from 1,000 units, ~50% off. Private-label runs from 1,000 with 12-week lead time. No surprises mid-quarter.",
  },
];

export function WhyDistributors() {
  const { t } = useLocale();
  const titleSrc = t("why.title");
  const lastDot = titleSrc.lastIndexOf(".");
  const lastSpace = titleSrc.lastIndexOf(" ", lastDot > 0 ? lastDot - 1 : titleSrc.length);
  const lastSpace2 = titleSrc.lastIndexOf(" ", lastSpace - 1);
  const head = lastSpace2 > 0 ? titleSrc.slice(0, lastSpace2 + 1) : titleSrc;
  const tail = lastSpace2 > 0 ? titleSrc.slice(lastSpace2 + 1) : "";
  return (
    <section className="reveal-on-scroll border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t("why.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {head}<span className="text-primary">{tail}</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <article
                key={r.title}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-7"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  / 0{i + 1}
                </div>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold leading-tight tracking-tight">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
