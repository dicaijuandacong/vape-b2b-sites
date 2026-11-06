import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — talk to sales",
  description: `WhatsApp, email or the wholesale form — ${SITE.name} sales answers within one business day.`,
};

export default function ContactPage() {
  return (
    <div className="pt-32 sm:pt-40">
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Contact
        </p>
        <h1 className="mt-2 font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Talk to a human.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          No ticket queues. WhatsApp is fastest — or send the wholesale form and we reply with a
          tiered price sheet, typically within one business day.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              WhatsApp (fastest)
            </p>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappText)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block font-display text-lg font-semibold hover:underline"
            >
              {SITE.phoneDisplay}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">Chat directly with sales</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 block break-all font-display text-lg font-semibold hover:underline"
            >
              {SITE.email}
            </a>
            <p className="mt-1 text-xs text-muted-foreground">Quote requests · buyer packs</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Coverage
            </p>
            <p className="mt-2 font-display text-lg font-semibold">{SITE.regionLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">{SITE.shippingLine}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/wholesale#contact">
              Send the wholesale form
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/catalog">Browse the catalog</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link href="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
