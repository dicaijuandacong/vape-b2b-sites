import Link from "next/link";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ShieldCheckIcon, BoltIcon, PackageIcon } from "@/components/icons";
import { getProduct } from "@/lib/data";
import { productOrBrandImg } from "@/lib/img";

const SPOTLIGHT_ID = "jnr-windwhip-44000";

export function FeaturedSpotlight() {
  const found = getProduct(SPOTLIGHT_ID);
  if (!found) return null;
  const { product, brand } = found;
  const img = productOrBrandImg(product.id, brand.id);

  return (
    <section className="reveal-on-scroll border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">
              Featured this month
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              The flagship that <span className="text-primary">moves the most pallets.</span>
            </h2>
          </div>
        </div>

        <div className="group mt-10 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Visual */}
            <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto">
              {img ? (
                <Image
                  src={img}
                  alt={`${brand.name} ${product.model}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <SpotlightFallback />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-card/60 lg:bg-gradient-to-r"
              />
              <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
                Best mover · Q1 2026
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center gap-6 p-8 sm:p-12">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {brand.name}
                </div>
                <h3 className="mt-1 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {product.model}
                </h3>
              </div>

              <p className="text-base leading-relaxed text-muted-foreground">
                Premium leather upholstery, smart screen, dynamic breathing light, adjustable
                airflow, 2-in-1 dual-tank design. The current single highest-velocity SKU in our
                EU warehouse — distributors typically reorder the WindWhip 44K within 21 days.
              </p>

              {/* Spec strip */}
              <div className="grid grid-cols-3 gap-3">
                <SpecStat icon={BoltIcon} label="Puffs" value={product.puffs ? `${(product.puffs / 1000).toFixed(0)}K` : "—"} />
                <SpecStat icon={PackageIcon} label="Flavors" value={String(product.flavors.length)} />
                <SpecStat icon={ShieldCheckIcon} label="Compliance" value="TPD" />
              </div>

              {/* Pricing strip */}
              <div className="rounded-2xl border border-border bg-background p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Wholesale
                    </div>
                    <div className="mt-1 font-display text-3xl font-semibold text-foreground">
                      <QuoteLabel />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      MOQ from
                    </div>
                    <div className="mt-1 font-mono text-base text-foreground">
                      {product.tiers[0]?.moq.toLocaleString() ?? "—"} units
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href={`/products/${product.id}`}>
                    See full spec
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href="/wholesale">Quote this SKU</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
      <Icon className="h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function SpotlightFallback() {
  return (
    <div className="relative h-full min-h-[360px] w-full bg-gradient-to-br from-[#E2E8F0] via-[#0F172A] to-[#0F172A]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(37,99,235,0.25) 0%, transparent 60%)",
        }}
      />
      {/* Big stylized device */}
      <div className="absolute left-1/2 top-1/2 h-72 w-32 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-[2rem] bg-gradient-to-b from-[#CBD5E1] via-[#E2E8F0] to-[#0F172A] shadow-[inset_0_0_40px_rgba(37,99,235,0.18),0_30px_60px_-20px_rgba(37,99,235,0.4)]">
        <div className="absolute inset-x-6 top-3 h-1.5 rounded-full bg-foreground/40" />
        <div className="absolute inset-x-3 top-10 h-40 rounded-2xl bg-black/55 ring-1 ring-foreground/10">
          <div className="absolute inset-3 flex items-end gap-1">
            {[60, 80, 65, 90, 70, 85, 55].map((h, i) => (
              <span key={i} className="flex-1 rounded-sm bg-primary/80" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-4 h-2 rounded-full bg-primary/60" />
      </div>
    </div>
  );
}
