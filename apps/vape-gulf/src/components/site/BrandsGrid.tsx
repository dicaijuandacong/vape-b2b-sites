import Link from "next/link";
import Image from "next/image";
import { BRANDS } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "@/components/icons";
import { genImg, brandImgSlug } from "@/lib/img";

// All brands share the lime accent — restraint > variety. Subtle hue shifts only.
const ACCENTS: Record<string, { from: string; to: string }> = {
  vozol:   { from: "#D9B45B", to: "#17C97B" },
  vapen:   { from: "#D9B45B", to: "#17C97B" },
  waspe:   { from: "#D9B45B", to: "#17C97B" },
  fumot:   { from: "#D9B45B", to: "#17C97B" },
  jnr:     { from: "#D9B45B", to: "#17C97B" },
  razzbar: { from: "#D9B45B", to: "#17C97B" },
  vapme:   { from: "#D9B45B", to: "#17C97B" },
};

export function BrandsGrid() {
  return (
    <section
      id="brands"
      className="border-t border-border/60 bg-background py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Badge variant="muted" size="lg" className="mb-4">
              Distributor portfolio
            </Badge>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Fourteen manufacturer-grade <span className="text-gradient-primary">vape brands</span>,
              one Kingdom stocking partner.
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Each brand below is a signed, Riyadh-warehoused, GCC-shippable line. We cover the full
              category spread — sleek pod systems, premium 25K-50K rechargeable disposables, and
              shisha-style hookah formats — so every retailer assortment can be filled from one PO.
            </p>
          </div>
          <Link
            href="/brands"
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            View full catalog
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRANDS.map((brand, index) => {
            const accent = ACCENTS[brand.id] ?? ACCENTS.vapen;
            const flavors = new Set<string>();
            brand.products.forEach((p) =>
              p.flavors.forEach((f) => flavors.add(f.toLowerCase()))
            );
            const featured = index === 0;
            const imgPath = genImg(brandImgSlug(brand.id));

            return (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className={`group reveal-on-scroll tilt-card border-trace relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_28px_60px_-25px_rgba(217,180,91,0.55)] ${featured ? "sm:col-span-2 sm:row-span-1" : ""}`}
              >
                {imgPath ? (
                  <>
                    <Image
                      src={imgPath}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="absolute inset-0 -z-10 object-cover opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 -z-10 bg-gradient-to-tr from-card via-card/70 to-transparent"
                    />
                  </>
                ) : (
                  <>
                    <div
                      aria-hidden
                      className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                      style={{
                        background: `radial-gradient(closest-side, ${accent.from}, transparent)`,
                      }}
                    />
                    <div
                      aria-hidden
                      className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
                      style={{
                        background: `radial-gradient(closest-side, ${accent.to}, transparent)`,
                      }}
                    />
                  </>
                )}

                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" size="md" className="font-mono">
                      {String(index + 1).padStart(2, "0")}
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {brand.products.length} SKUs · {flavors.size} flavors
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight">
                    {brand.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{brand.tagline}</p>

                  {/* Top SKU pills */}
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {brand.products.slice(0, 4).map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {p.model}
                      </span>
                    ))}
                    {brand.products.length > 4 && (
                      <span className="rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        +{brand.products.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground">
                    Open brand catalog
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
