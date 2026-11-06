"use client";

import Link from "next/link";
import { getAllProducts } from "@/lib/data";
import { ArrowRightIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/locale-context";

const ALL = getAllProducts();

export function Categories() {
  const { t } = useLocale();

  const CATEGORIES = [
    { id: "rechargeable-disposable", label: t("cat.rechargeable"), desc: t("cat.rechargeable.desc"), icon: ChargingIcon },
    { id: "disposable",              label: t("cat.disposable"),   desc: t("cat.disposable.desc"),   icon: PuffIcon },
    { id: "shisha-style",            label: t("cat.shisha"),       desc: t("cat.shisha.desc"),       icon: HookahIcon },
    { id: "pod-kit",                 label: t("cat.podkit"),       desc: t("cat.podkit.desc"),       icon: PodIcon },
    { id: "open-system",             label: t("cat.eliquid"),      desc: t("cat.eliquid.desc"),      icon: LiquidIcon },
  ];

  const counts = CATEGORIES.map((c) => ({
    ...c,
    count: ALL.filter((p) => p.category === c.id).length,
  }));

  // Render full catalog title with embedded primary span
  const titleSrc = t("cat.title");
  // Heuristic: highlight last 2-3 words in primary
  const lastSpaceIdx = titleSrc.lastIndexOf(" ");
  const titleHead = lastSpaceIdx > 0 ? titleSrc.slice(0, lastSpaceIdx + 1) : titleSrc;
  const titleTail = lastSpaceIdx > 0 ? titleSrc.slice(lastSpaceIdx + 1) : "";

  return (
    <section className="reveal-on-scroll border-t border-border bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">
              {t("cat.eyebrow")}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {titleHead}<span className="text-primary">{titleTail}</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            {t("three.cta.fullCatalog")}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {counts.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">{c.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">
                    {c.count} SKUs
                  </span>
                  <ArrowRightIcon className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---- Inline category icons (lime accent on hover via currentColor) ----

function ChargingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3h6v3l-1 1h-4l-1-1V3Z" />
      <rect x="8" y="7" width="8" height="14" rx="2" />
      <path d="m12 11-2 3h4l-2 3" />
    </svg>
  );
}

function PuffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="2" width="6" height="20" rx="2" />
      <path d="M11 6h2M11 9h2" />
      <path d="M16 11c2 1 2 4 0 5M18 9c3 2 3 7 0 10" opacity="0.5" />
    </svg>
  );
}

function HookahIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="20" rx="6" ry="2" />
      <path d="M9 8v12M15 8v12" />
      <rect x="8" y="4" width="8" height="5" rx="2" />
      <path d="M16 6c2 0 4 1 4 3v3" />
    </svg>
  );
}

function PodIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="4" width="12" height="13" rx="2" />
      <rect x="9" y="7" width="6" height="7" rx="1" />
      <path d="M9 17v3M15 17v3M11 20h2" />
    </svg>
  );
}

function LiquidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 2h6v3a3 3 0 0 1 1 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7a3 3 0 0 1 1-2V2Z" />
      <path d="M9 12c2 1 4-1 6 0" />
    </svg>
  );
}
