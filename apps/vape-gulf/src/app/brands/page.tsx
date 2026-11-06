import type { Metadata } from "next";
import { BrandsGrid } from "@/components/site/BrandsGrid";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Brands · 14 manufacturer-grade vape lines",
  description:
    "GulfVape Trading stocks 14 manufacturer-grade vape brands: VOZOL, Vapen, WASPE, FUMOT, JNR, Razzbar and VAPME. Browse each line with SFDA-aware product catalogs.",
};

export default function BrandsPage() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <Badge variant="muted" size="lg" className="mb-4">All brands</Badge>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Fourteen brands. <span className="text-gradient-primary">One Kingdom stocking partner.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Hand-picked manufacturer lines covering pod kits, premium 25K-50K rechargeable
          disposables, and shisha-style hookah formats. Click into any brand to see its full
          SKU table with tier pricing.
        </p>
      </section>
      <BrandsGrid />
    </div>
  );
}
