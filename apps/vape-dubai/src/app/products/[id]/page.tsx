import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProducts, getProduct } from "@/lib/data";
import { SITE } from "@/lib/site";
import { productLd, breadcrumbLd } from "@/lib/jsonld";
import { productOrBrandImg, hasFlavorImg } from "@/lib/img";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ArrowRightIcon, ShieldCheckIcon, BoltIcon, PackageIcon, VapePodIcon } from "@/components/icons";

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const found = getProduct(id);
  if (!found) return { title: "Product not found" };
  const { product } = found;
  return {
    title: `${product.brand} ${product.model}`,
    description: `${product.brand} ${product.model} — ${product.flavors.length} flavors${product.puffs ? `, ${product.puffs.toLocaleString()} puffs` : ""}. Jebel Ali warehouse, same-day Dubai dispatch.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const found = getProduct(id);
  if (!found) notFound();
  const { product, brand } = found;

  const productSchema = productLd(product, brand);
  const breadcrumbSchema = breadcrumbLd([
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: brand.name, url: `/brands/${brand.id}` },
    { name: product.model, url: `/products/${product.id}` },
  ]);

  // Precompute image paths server-side so lib/img.ts's fs reads stay off the client.
  const defaultSrc = productOrBrandImg(product.id, brand.id);
  const flavorImgs = product.flavors.map((f) => ({
    flavor: f,
    src: productOrBrandImg(product.id, brand.id, f),
    hasReal: hasFlavorImg(product.id, f),
  }));

  return (
    <div className="pt-32 sm:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href={`/brands/${brand.id}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {brand.name}
        </Link>

        <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Left column — gallery */}
          <ProductGallery
            defaultSrc={defaultSrc}
            flavors={flavorImgs}
            productLabel={`${brand.name} ${product.model}`}
          />

          {/* Right column — content + pricing */}
          <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div>
            <Badge variant="default" size="lg" className="mb-4">
              {product.brand}
            </Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              {product.model}
            </h1>

            <div className="mt-6 flex flex-wrap gap-2">
              {product.puffs && (
                <Badge variant="default" size="md" className="font-mono">
                  <BoltIcon className="h-3.5 w-3.5" />
                  {product.puffs.toLocaleString()} puffs
                </Badge>
              )}
              <Badge variant="muted" size="md" className="capitalize">
                <VapePodIcon className="h-3.5 w-3.5" />
                {product.category.replace(/-/g, " ")}
              </Badge>
              {product.salt_nicotine_pct && (
                <Badge variant="muted" size="md">
                  Nicotine {product.salt_nicotine_pct}%
                </Badge>
              )}
              {product.battery_mah && (
                <Badge variant="muted" size="md">
                  {product.battery_mah} mAh
                </Badge>
              )}
              <Badge variant="success" size="md">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Jebel Ali warehouse · Same-day
              </Badge>
            </div>

            {/* Spec table */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {product.battery_type && (
                <Spec label="Charging" value={product.battery_type} />
              )}
              {product.eliquid_ml && (
                <Spec label="E-liquid" value={`${product.eliquid_ml} ml`} />
              )}
              {product.coil && <Spec label="Coil" value={product.coil} />}
              {product.airflow && <Spec label="Airflow" value={product.airflow} />}
              {product.design_notes && (
                <Spec label="Design" value={product.design_notes} className="sm:col-span-2" />
              )}
            </div>

            {/* Flavors */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold">
                {product.flavors.length} flavors
              </h2>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {product.flavors.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — pricing + CTA */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Wholesale tiers
              </h3>
              <div className="mt-5 space-y-3">
                {product.tiers.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-4 rounded-lg border border-border/60 bg-background/40 px-4 py-3"
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        From
                      </div>
                      <div className="font-mono text-base">{t.moq.toLocaleString()} units</div>
                    </div>
                    <div className="font-display text-2xl font-semibold text-muted-foreground">
                      On request
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full" size="lg">
                <Link href="/wholesale">
                  Request quote
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full" size="lg">
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                    `Hi ${SITE.shortName}, I'm interested in wholesale pricing for the ${product.brand} ${product.model}` +
                      `${product.puffs ? ` (${product.puffs.toLocaleString()} puffs)` : ""}. Could you send me the tier pricing?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ask about this product on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="mt-2 w-full" size="lg">
                <Link href="/wholesale#sample-box">Add to sample box</Link>
              </Button>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Pricing excludes VAT & excise. Delivery included for Jebel Ali warehouse stock. Lead time
                5-7 business days from PO confirmation.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Spec({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/60 bg-card/40 px-4 py-3 ${className ?? ""}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{value}</div>
    </div>
  );
}
