import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Compliance & legal",
  description: "EuroVape compliance documentation is shared with verified B2B buyers on request.",
};

export default function CompliancePage() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Compliance & legal
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Documentation on request.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            EuroVape is a B2B wholesale operation. Product documentation — including ingredient
            lists, battery specifications, shipping declarations, and per-country availability —
            is shared with verified buyers as part of the standard quote-and-purchase flow.
          </p>
          <p>
            If you are evaluating us as a supplier and need this information up front, request a
            buyer pack via the wholesale form. We typically respond within one business day.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/wholesale#contact">
              Request buyer pack
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/about">About EuroVape</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
