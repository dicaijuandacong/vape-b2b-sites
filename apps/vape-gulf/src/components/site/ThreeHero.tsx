import Link from "next/link";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { getProduct } from "@/lib/data";
import { productOrBrandImg } from "@/lib/img";

/**
 * vapsolo.com signature section: 3 hero products side-by-side with
 * big colorful imagery. We pick top 3 across our 14 brands.
 */

const PICKS = [
  { id: "jnr-windwhip-44000", tagline: "44K puffs · 20 flavors", subtitle: "Best mover · Q1 2026" },
  { id: "razzbar-65k", tagline: "65K puffs · 16 flavors", subtitle: "Top reorder velocity" },
  { id: "vapme-crystal-48k", tagline: "48K puffs · Crystal cut", subtitle: "Distributor favorite" },
];

export function ThreeHero() {
  const items = PICKS.map((pk) => ({
    pick: pk,
    found: getProduct(pk.id),
  })).filter((x): x is { pick: typeof PICKS[number]; found: NonNullable<ReturnType<typeof getProduct>> } => Boolean(x.found));

  if (items.length === 0) return null;

  return (
    <section className="reveal-on-scroll border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              GulfVape picks
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Three flagship SKUs, <span className="text-primary">three velocities.</span>
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

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map(({ pick, found }) => {
            const { product, brand } = found;
            const img = productOrBrandImg(product.id, brand.id);
            return (
              <Link
                key={pick.id}
                href={`/products/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_30px_60px_-30px_rgba(217,180,91,0.45)]"
              >
                {/* Big image area — vapsolo signature: tall, colorful, immersive */}
                <div className="relative aspect-[5/4] overflow-hidden bg-muted">
                  {img ? (
                    <Image
                      src={img}
                      alt={`${brand.name} ${product.model}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <BigDevice brandId={brand.id} brandName={brand.name} model={product.model} />
                  )}

                  {/* Tagline pill top-left */}
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    {pick.subtitle}
                  </div>

                  {/* Price pill bottom-right (vapsolo style) */}
                  <div className="absolute bottom-4 right-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(217,180,91,0.6)]">
                    <QuoteLabel />
                  </div>
                </div>

                {/* Content footer */}
                <div className="flex flex-col gap-3 p-6">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {brand.name}
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight">
                      {product.model}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {pick.tagline}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full border-foreground/15 self-start"
                  >
                    <span>
                      View product
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </span>
                  </Button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BigDevice({
  brandId,
  brandName,
  model,
}: {
  brandId: string;
  brandName: string;
  model: string;
}) {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-primary/20 via-card to-background">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(217,180,91,0.15) 0%, transparent 60%)",
        }}
      />
      {/* Big stylized device */}
      <div className="absolute left-1/2 top-1/2 h-3/5 w-1/5 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-b from-card via-background to-card shadow-[inset_0_0_30px_rgba(217,180,91,0.18),0_24px_50px_-20px_rgba(217,180,91,0.4)] ring-1 ring-foreground/10">
        <div className="absolute inset-x-3 top-2 h-1 rounded-full bg-foreground/40" />
        <div className="absolute inset-x-2 top-6 h-12 rounded-xl bg-black/50">
          <div className="absolute inset-2 flex items-end gap-0.5">
            {[55, 75, 65, 85, 70].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-primary/80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-3 bottom-2 h-1.5 rounded-full bg-primary/60" />
      </div>
      <div className="absolute right-3 top-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
        {brandName} · {model}
      </div>
    </div>
  );
}
