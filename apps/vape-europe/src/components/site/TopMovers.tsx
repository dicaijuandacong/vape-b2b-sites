import Link from "next/link";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/icons";
import { getAllProducts } from "@/lib/data";
import { productOrBrandImg } from "@/lib/img";

const TOP_IDS = [
  "jnr-windwhip-44000",
  "razzbar-65k",
  "vapme-crystal-48k",
  "fumot-tornado-14000",
  "vapen-storm-pro",
  "waspe-iris",
  "vozol-star-click-12000",
  "jnr-magic-vape-45000",
];

const FAUX_VOLUMES: Record<string, string> = {
  "jnr-windwhip-44000": "1,247",
  "razzbar-65k": "1,098",
  "vapme-crystal-48k": "964",
  "fumot-tornado-14000": "812",
  "vapen-storm-pro": "788",
  "waspe-iris": "654",
  "vozol-star-click-12000": "612",
  "jnr-magic-vape-45000": "590",
};

const FAUX_TREND: Record<string, string> = {
  "jnr-windwhip-44000": "+18%",
  "razzbar-65k": "+24%",
  "vapme-crystal-48k": "+11%",
  "fumot-tornado-14000": "+7%",
  "vapen-storm-pro": "+15%",
  "waspe-iris": "+9%",
  "vozol-star-click-12000": "+22%",
  "jnr-magic-vape-45000": "+13%",
};

export function TopMovers() {
  const all = getAllProducts();
  const rows = TOP_IDS.map((id) => all.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (rows.length === 0) return null;

  return (
    <section className="border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Top movers · Q1 2026
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              The eight SKUs <span className="text-primary">distributors reorder fastest.</span>
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            See full catalog
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Top movers — auction-card pattern from NFT marketplace */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((p) => {
            const img = productOrBrandImg(p.id, p.brand.toLowerCase());
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="group reveal-on-scroll tilt-card border-trace flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-3 hover:border-primary/50 hover:shadow-[0_22px_50px_-22px_rgba(37,99,235,0.45)]"
              >
                {/* Header — like NFT marketplace card chip */}
                <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {p.brand.slice(0, 1)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {p.brand}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {FAUX_TREND[p.id] ?? "+10%"} ↗
                  </span>
                </div>

                {/* Image */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                  {img ? (
                    <Image src={img} alt={p.model} fill sizes="240px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                  ) : (
                    <FauxDevice brandId={p.brand.toLowerCase()} />
                  )}
                  {p.puffs && (
                    <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground backdrop-blur">
                      {(p.puffs / 1000).toFixed(0)}K puffs
                    </span>
                  )}
                </div>

                {/* Bottom — title + bid pill */}
                <div className="flex items-end justify-between px-1.5 pb-1 pt-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">
                      {p.model}
                    </h3>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {FAUX_VOLUMES[p.id] ?? "500"} units · this quarter
                    </div>
                  </div>
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-transform group-hover:scale-105">
                    <QuoteLabel />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FauxDevice({ brandId }: { brandId: string }) {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-primary/15 via-card to-background">
      <div className="absolute left-1/2 top-1/2 h-3/5 w-1/4 -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground/5 ring-1 ring-foreground/15" />
      <div className="absolute inset-x-3 bottom-3 h-1.5 rounded-full bg-primary/60" />
      <div className="absolute right-2 top-2 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/50">
        {brandId.slice(0, 5)}
      </div>
    </div>
  );
}
