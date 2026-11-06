import type { Metadata } from "next";
import { QuoteLabel } from "@/components/site/QuoteLabel";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRANDS, getBrand, lowestTierMoq } from "@/lib/data";
import { brandLd, breadcrumbLd } from "@/lib/jsonld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, BoltIcon, PackageIcon, ShieldCheckIcon } from "@/components/icons";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: "Brand not found" };
  return {
    title: `${brand.name} · ${brand.products.length} SKUs`,
    description: `${brand.name} catalog — ${brand.tagline}. ${brand.products.length} TPD-aware SKUs available for European wholesale.`,
  };
}

export default async function BrandPage({ params }: { params: Params }) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const allFlavors = new Set<string>();
  brand.products.forEach((p) => p.flavors.forEach((f) => allFlavors.add(f.toLowerCase())));

  const brandSchema = brandLd(brand);
  const breadcrumbSchema = breadcrumbLd([
    { name: "Home", url: "/" },
    { name: "Brands", url: "/brands" },
    { name: brand.name, url: `/brands/${brand.id}` },
  ]);

  return (
    <div className="pt-32 sm:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Hero */}
      <section className="relative isolate overflow-hidden pb-12">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 20%, rgba(37,99,235,0.10) 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, rgba(37,99,235,0.06) 0%, transparent 65%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All brands
          </Link>
          <Badge variant="default" size="lg" className="mt-6">
            {brand.products.length} SKUs · {allFlavors.size} unique flavors
          </Badge>
          <h1 className="mt-4 font-display text-6xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            {brand.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{brand.tagline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/wholesale">
                Request quote for {brand.name}
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/compliance">View compliance docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SKU Table */}
      <section className="border-t border-border/60 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Full SKU lineup
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Wholesale pricing shared 1-on-1. Lower tiers reflect higher MOQ commitments. Country
                availability filters apply at checkout.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheckIcon className="h-4 w-4 text-primary" />
              All SKUs TPD-notified
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-card/60">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-5 py-4">Model</th>
                    <th className="px-5 py-4">Puffs</th>
                    <th className="px-5 py-4">Battery</th>
                    <th className="px-5 py-4">Flavors</th>
                    <th className="px-5 py-4 text-right">MOQ</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {brand.products.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-background/40">
                      <td className="px-5 py-4">
                        <div className="font-display text-base font-semibold">{p.model}</div>
                        <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {p.category.replace(/-/g, " ")}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-foreground">
                        {p.puffs ? `${(p.puffs / 1000).toFixed(0)}K` : "—"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {p.battery_mah ? `${p.battery_mah} mAh` : "—"}
                        {p.battery_type ? ` · ${p.battery_type}` : ""}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <span className="font-mono">{p.flavors.length}</span> flavors
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-muted-foreground">
                        {lowestTierMoq(p).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/products/${p.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-foreground"
                        >
                          Open
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
