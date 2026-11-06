"use client";

import * as React from "react";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Link from "next/link";
import { BRANDS, getAllProducts, lowestTierMoq, PRODUCTS_STATS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const ALL = getAllProducts();

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "rechargeable-disposable", label: "Rechargeable" },
  { id: "disposable", label: "Disposable" },
  { id: "shisha-style", label: "Shisha-style" },
  { id: "pod-kit", label: "Pod kit" },
];

export default function ProductsPage() {
  const [query, setQuery] = React.useState("");
  const [brandFilter, setBrandFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return ALL.filter((p) => {
      if (brandFilter !== "all" && p.brand.toLowerCase() !== brandFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        p.brand,
        p.model,
        ...p.flavors,
        p.category,
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, brandFilter, categoryFilter]);

  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <Badge variant="muted" size="lg" className="mb-4">
          Full catalog · {ALL.length} SKUs
        </Badge>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Every SKU in one <span className="text-gradient-primary">filterable table.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Search by brand, model, flavor or category. Wholesale pricing is shared 1-on-1 —
          request a quote for your exact mix.
        </p>

        {/* Filters */}
        <div className="mt-10 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${PRODUCTS_STATS.total_products} SKUs by brand, model, or flavor…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filtered.length} of {ALL.length} matched
          </div>
        </div>

        {/* Brand pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <FilterPill active={brandFilter === "all"} onClick={() => setBrandFilter("all")}>
            All brands
          </FilterPill>
          {BRANDS.map((b) => (
            <FilterPill
              key={b.id}
              active={brandFilter === b.id}
              onClick={() => setBrandFilter(b.id)}
            >
              {b.name} <span className="ml-1 font-mono text-[10px] opacity-70">{b.products.length}</span>
            </FilterPill>
          ))}
        </div>

        {/* Category pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <FilterPill
              key={c.id}
              active={categoryFilter === c.id}
              onClick={() => setCategoryFilter(c.id)}
              tone="accent"
            >
              {c.label}
            </FilterPill>
          ))}
        </div>
      </section>

      {/* Results grid */}
      <section className="bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 card-hover"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {p.brand}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
                      {p.model}
                    </h3>
                  </div>
                  {p.puffs && (
                    <Badge variant="default" size="sm" className="font-mono">
                      {(p.puffs / 1000).toFixed(0)}K
                    </Badge>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {p.flavors.length} flavors · {p.category.replace(/-/g, " ")}
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-border/40 pt-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Wholesale</div>
                    <div className="mt-0.5 font-display text-xl font-semibold">
                      <QuoteLabel />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">MOQ</div>
                    <div className="mt-0.5 font-mono text-sm">{lowestTierMoq(p).toLocaleString()}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-base text-muted-foreground">
                No SKUs match those filters. Try widening the brand or category.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  tone = "primary",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "primary" | "accent";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? tone === "accent"
            ? "border-accent/50 bg-accent/15 text-accent"
            : "border-primary/50 bg-primary/15 text-primary"
          : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
