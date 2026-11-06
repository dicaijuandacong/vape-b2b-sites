import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ — wholesale questions answered",
  description:
    "MOQ, shipping times, EU compliance, sample boxes and payment — the questions independent vape retailers ask before their first order.",
};

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is your minimum order?",
    a: `The starter tier is ${"1 box"} with a mixed assortment from 50 units per SKU — built for independent shops testing our range. Bulk pricing starts from 200 units, and private label runs from 1,000 units.`,
  },
  {
    q: "How fast is delivery?",
    a: `We ship from our ${SITE.warehouseLine.split("—")[0].trim()} facilities — ${SITE.shippingLine.toLowerCase()}. Duties and customs are cleared per market (DDP where applicable); exact lead time is confirmed with your quote.`,
  },
  {
    q: "Is your stock EU compliant?",
    a: `Yes. All EU-bound stock is ${SITE.complianceLine.replace(" · 18+", "")}. Compliance documentation — ingredient lists, battery specs and shipping declarations — is shared with verified buyers as part of the quote flow.`,
  },
  {
    q: "Can I try a sample box first?",
    a: `Yes — the ${SITE.sampleBoxPrice} sample box is a curated mix across our best-selling SKUs, so you can verify quality and pick what sells in your store before committing to a bulk order.`,
  },
  {
    q: "What countries do you serve?",
    a: `${SITE.regionLabel}. DDP shipping means the price we quote is the price you pay — no customs surprises at your door.`,
  },
  {
    q: "How does pricing work? Is VAT included?",
    a: "Tier prices are quoted 1-on-1 and exclude VAT. Volume tiers drop per-unit — the more you take of a SKU, the lower the unit price. Request a quote for your exact mix and we return a full price sheet.",
  },
  {
    q: "What are the payment terms?",
    a: "Payment options are confirmed with your quote — bank transfer (T/T) is standard for established orders. First-order terms and repeat-customer terms are discussed with sales.",
  },
  {
    q: "Can you do private label / my own brand?",
    a: `Yes. Private label starts at ${SITE.privateLabelMoq} units with custom shell, packaging and flavor mix — TPD / EU-CEG notification handled by us. Lead time is around 12 weeks.`,
  },
  {
    q: "How do I start?",
    a: "Send the wholesale form (or WhatsApp us directly). We typically respond within one business day with a tiered price sheet for the products you care about.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="pt-32 sm:pt-40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          FAQ
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Before your first order.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          The questions independent retailers ask us most. Anything not covered — WhatsApp or
          email us, we answer within one business day.
        </p>

        <div className="mt-12 divide-y divide-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-foreground">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/wholesale#contact">
              Request a quote
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/catalog">Browse the catalog</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
