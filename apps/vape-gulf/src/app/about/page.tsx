import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description: "GulfVape Trading is a Saudi wholesale vape distributor focused on SFDA / SASO conformity, taste, and dependable GCC supply.",
};

export default function AboutPage() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <Badge variant="muted" size="lg" className="mb-4">
          About GulfVape
        </Badge>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          The wholesale stack <span className="text-gradient-primary">Saudi retailers</span> have been waiting for.
        </h1>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            GulfVape Trading is a wholesale vape distributor headquartered in Riyadh, with a
            bonded warehouse and cross-docks in Jeddah and Dammam. We sign manufacturer-grade
            brands — VOZOL, Vapen, WASPE, FUMOT, JNR, Razzbar, VAPME — and resell them to
            Saudi and GCC retailers under one PO, one conformity file, one country rule set.
          </p>
          <p>
            We do this because the alternative was painful. Most wholesalers force you to
            audit each SKU against SFDA, SASO and GCC rule sets yourself. We built the catalog
            around the rule sets so retailers don&apos;t have to.
          </p>
          <p>
            Our taste in product is conservative. We don&apos;t list cartoony candy
            disposables. We don&apos;t list unbranded white-label. We don&apos;t list anything
            without SFDA / SASO conformity (where applicable). If you&apos;re looking for the
            loudest catalog on the market, we&apos;re not it.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/wholesale">
              Open wholesale portal
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/compliance">View compliance posture</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
