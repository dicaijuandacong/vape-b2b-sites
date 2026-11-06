import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/lib/data";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

const SKU_COUNT = getAllProducts().length;
const BRAND_COUNT = new Set(getAllProducts().map((p) => p.brand)).size;

export const metadata: Metadata = {
  title: "Wholesale catalog",
  description: `Full ${SKU_COUNT}-SKU wholesale catalog across ${BRAND_COUNT} brands — MOQ tiers per SKU, pricing shared on request. Print or save as PDF.`,
};

/**
 * 目录/报价单页：全 SKU 阶梯价一览，打印即 PDF（Ctrl+P → Save as PDF）。
 * 打印时隐藏悬浮挂件（.fixed），保留表格。
 */
export default function CatalogPage() {
  const products = getAllProducts().slice().sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return a.model.localeCompare(b.model);
  });
  const skuCount = products.length;
  const brandCount = new Set(products.map((p) => p.brand)).size;

  return (
    <div className="pt-32 sm:pt-40">
      <style>{`@media print { .fixed, .no-print, header nav { display: none !important; } body { background: white; } }`}</style>
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Wholesale catalog
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          {skuCount} SKUs · {brandCount} brands.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          MOQ tiers per SKU; wholesale pricing is shared on request (excl. VAT/excise where
          applicable). {SITE.warehouseLine} · {SITE.shippingLine}. Request a quote to lock in
          your mix.
        </p>

        <div className="no-print mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/wholesale#contact">
              Request a quote
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/faq">Ordering FAQ</Link>
          </Button>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4">Brand</th>
                <th className="py-2 pr-4">Model</th>
                <th className="py-2 pr-4">Puffs</th>
                <th className="py-2 pr-4">Flavors</th>
                <th className="py-2 pr-4">MOQ · Tier 1</th>
                <th className="py-2 pr-4">MOQ · Tier 2</th>
                <th className="py-2">MOQ · Tier 3</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-foreground">{p.brand}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/products/${p.id}`} className="hover:underline">
                      {p.model}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {p.puffs ? p.puffs.toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{p.flavors.length}</td>
                  {[0, 1, 2].map((i) => {
                    const t = p.tiers[i];
                    return (
                      <td key={i} className="py-2 pr-4 tabular-nums">
                        {t ? (
                          <span className="font-medium">{t.moq.toLocaleString()}+</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          {SITE.name} · {SITE.email} · {SITE.phoneDisplay} — {SITE.regionLabel}. Pricing is
          shared on request and excludes VAT. To save this catalog as PDF: Ctrl/Cmd+P →
          “Save as PDF”.
        </p>
      </section>
    </div>
  );
}
