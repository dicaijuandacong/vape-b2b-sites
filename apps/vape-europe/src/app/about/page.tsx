import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description: "EuroVape Supply is a European wholesale vape distributor focused on compliance, taste, and dependable supply.",
};

export default function AboutPage() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <Badge variant="muted" size="lg" className="mb-4">
          About EuroVape
        </Badge>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          The wholesale stack <span className="text-gradient-primary">European retailers</span> have been waiting for.
        </h1>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            EuroVape is an EU-warehoused wholesale vape distributor headquartered between
            Rotterdam and Frankfurt. We sign manufacturer-grade brands — VOZOL, Vapen, WASPE,
            FUMOT, JNR, Razzbar, VAPME — and resell them to European retailers under one PO,
            one passport, one country rule set.
          </p>
          <p>
            We do this because the alternative was painful. Most wholesalers force you to
            audit each SKU against UK / FR / BE / NL rule sets yourself. We built the catalog
            around the rule sets so retailers don&apos;t have to.
          </p>
          <p>
            Our taste in product is conservative. We don&apos;t list cartoony candy
            disposables. We don&apos;t list unbranded white-label. We don&apos;t list anything
            without TPD / MHRA / EU-CEG notification (where applicable). If you&apos;re
            looking for the loudest catalog on the market, we&apos;re not it.
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
