import Link from "next/link";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, BoltIcon, PackageIcon, VapePodIcon } from "@/components/icons";
import { getFeaturedProducts, lowestTierMoq, PRODUCTS_STATS } from "@/lib/data";
import { productOrBrandImg } from "@/lib/img";
import type { Product } from "@/types/product";

export function FeaturedProducts() {
  const products = getFeaturedProducts();
  if (products.length === 0) return null;

  return (
    <section
      id="featured"
      className="relative overflow-hidden bg-card py-20 sm:py-28"
      aria-label="Featured products"
    >
      {/* Subtle gradient background */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 80% at 50% 0%, rgba(91,108,255,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Badge variant="accent" size="lg" className="mb-4">
              Featured catalog
            </Badge>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Six SKUs we&apos;d <span className="text-gradient-primary">stock first</span>.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Hand-picked across our fourteen brands — each one balances flavor depth, build quality,
              ESMA conformity, and tier-pricing economics for first-order distributors.
            </p>
          </div>
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            See all {PRODUCTS_STATS.total_products} SKUs
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const fromMoq = lowestTierMoq(product);
  const img = productOrBrandImg(product.id, product.brand.toLowerCase());
  return (
    <Link
      href={`/products/${product.id}`}
      className="group reveal-on-scroll tilt-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-[0_28px_70px_-25px_rgba(0,255,255,0.5)]"
    >
      {/* Visual — abstract device representation */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border/50">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 30%, rgba(0,255,255,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 80% 80%, rgba(91,108,255,0.18) 0%, transparent 65%)",
          }}
        />
        {img ? (
          <Image
            src={img}
            alt={`${product.brand} ${product.model}`}
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <DeviceMock model={product.model} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.puffs && (
            <Badge variant="default" size="sm" className="font-mono">
              {(product.puffs / 1000).toFixed(0)}K puffs
            </Badge>
          )}
          <Badge variant="muted" size="sm" className="capitalize">
            {product.category.replace(/-/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {product.brand}
          </div>
          <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">
            {product.model}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1">
          {product.flavors.slice(0, 4).map((f) => (
            <span
              key={f}
              className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {f}
            </span>
          ))}
          {product.flavors.length > 4 && (
            <span className="rounded-full border border-border/60 bg-background/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              +{product.flavors.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/40 pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Wholesale
            </div>
            <div className="mt-0.5 font-display text-2xl font-semibold text-foreground">
              <QuoteLabel />
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              MOQ from
            </div>
            <div className="mt-0.5 font-mono text-base text-foreground">
              {fromMoq.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function DeviceMock({ model }: { model: string }) {
  // Lime-only device silhouette. Subtle variation by model name length.
  const tilt = ((model.length * 13) % 12) - 6; // -6° → +6°
  return (
    <div
      className="relative h-36 w-14 rounded-xl bg-gradient-to-b from-[#160A28] via-[#160A28] to-[#0A0218] shadow-[inset_0_0_20px_rgba(0,255,255,0.12),0_18px_40px_-20px_rgba(0,255,255,0.25)]"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="absolute inset-x-3 top-2 h-1 rounded-full bg-primary/70" />
      <div className="absolute inset-x-1.5 top-5 h-16 rounded-md bg-black/40 shadow-inner ring-1 ring-foreground/10">
        <div className="absolute inset-1 flex items-end gap-px">
          {[60, 75, 50, 80, 65].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-primary/70"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-2 bottom-2 h-1.5 rounded-full bg-primary/40" />
    </div>
  );
}
