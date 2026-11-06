"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightIcon,
  PackageIcon,
  ShieldCheckIcon,
  GlobeIcon,
  BoltIcon,
} from "@/components/icons";
import { BRAND_INDEX } from "@/lib/data";
import { COUNTRIES } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { FIELD_LIMITS, HONEYPOT_FIELD } from "@/lib/form-validation";

const TIERS = [
  {
    name: "Sample box",
    moq: "1 box",
    price: "€99",
    perks: ["6 hand-picked SKUs", "All 14 brands sampled", "Refundable on first order"],
    highlight: false,
  },
  {
    name: "Distributor — Starter",
    moq: "From 200 units",
    price: "Up to 35% off RRP",
    perks: ["Mixed assortment from 50/SKU", "EU warehouse · DDP", "5-7 day lead time"],
    highlight: true,
  },
  {
    name: "Distributor — Volume",
    moq: "From 1,000 units",
    price: "Up to 50% off RRP",
    perks: ["Single-SKU pallet pricing", "Custom mix per country rule set", "Dedicated account lead"],
    highlight: false,
  },
  {
    name: "Private label",
    moq: "From 1,000 units",
    price: "Custom",
    perks: ["Custom shell, packaging, flavor mix", "TPD / EU-CEG handled by us", "12-week lead time"],
    highlight: false,
  },
];

export default function WholesalePage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || submitted) return;

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload: Record<string, unknown> = {
      company: (fd.get("company") ?? "").toString().trim(),
      country: (fd.get("country") ?? "").toString().trim(),
      email: (fd.get("email") ?? "").toString().trim(),
      // Honeypot — sent along so the API can silently drop bot submissions.
      [HONEYPOT_FIELD]: (fd.get(HONEYPOT_FIELD) ?? "").toString(),
    };
    const phone = (fd.get("phone") ?? "").toString().trim();
    if (phone) payload.phone = phone;
    const volume = (fd.get("volume") ?? "").toString().trim();
    if (volume) payload.volume = volume;
    const notes = (fd.get("notes") ?? "").toString().trim();
    if (notes) payload.notes = notes;
    const brands = fd.getAll("brand").map((b) => b.toString());
    if (brands.length > 0) payload.brands = brands;

    setFailed(false);
    setPending(true);
    try {
      const res = await fetch("/api/wholesale-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; id?: number }
        | null;
      if (res.ok && data?.ok) {
        setSubmitted(true);
      } else {
        // Delivery or validation failed — keep the form filled so the
        // buyer can retry or reach us directly.
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pt-32 sm:pt-40">
      <section className="relative isolate overflow-hidden pb-16">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 60%), radial-gradient(50% 50% at 90% 70%, rgba(37,99,235,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Badge variant="accent" size="lg" className="mb-4">
            <PackageIcon className="h-3.5 w-3.5" />
            Wholesale portal
          </Badge>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            <span className="text-gradient-primary">One PO,</span> fourteen brands, zero compliance noise.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground">
            Custom assortments from 50 units per SKU. Sample boxes for tier-1 retail buyers.
            Private label MOQ from 1,000 with TPD / EU-CEG notification handled by us. We split
            shipments by country rule set so your warehouse never hand-checks SKUs again.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section id="pricing" className="border-t border-border/60 bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Pricing tiers
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl border p-6 transition-colors ${
                  t.highlight
                    ? "border-primary/50 bg-primary/[0.06] shadow-[0_24px_60px_-30px_rgba(37,99,235,0.45)]"
                    : "border-border bg-card"
                }`}
              >
                {t.highlight && (
                  <Badge variant="default" size="sm" className="mb-3">
                    Most-requested
                  </Badge>
                )}
                <h3 className="font-display text-xl font-semibold">{t.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t.moq}
                </p>
                <p className="mt-4 font-display text-2xl font-semibold">{t.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="shipping" className="bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From quote to dock — the boring, predictable version
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Inquiry", body: "Brief us on volume, country mix, brand preferences. Initial reply within 1 business day." },
              { step: "2", title: "Quote + passport", body: "Tier pricing in EUR + Product Compliance Passports for the chosen SKUs." },
              { step: "3", title: "PO + payment", body: "SEPA / bank wire / Stripe (where allowed). 30% deposit on production-only items." },
              { step: "4", title: "DDP delivery", body: "5-7 days from EU warehouse, lot-level traceability, signed manifest on arrival." },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Step {s.step}
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="contact" className="bg-background py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Talk to a real human in 1 business day.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Fill the brief. We&apos;ll come back with a quote, passport pack, and recommended
              first PO mix tailored to your country rule set.
            </p>
            <div className="mt-8 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><GlobeIcon className="h-4 w-4 text-secondary" /> EU warehouses · Rotterdam, Frankfurt</div>
              <div className="flex items-center gap-2"><BoltIcon className="h-4 w-4 text-primary" /> 5-7 day DDP lead time</div>
              <div className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-accent" /> TPD / MHRA / EU-CEG notified</div>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" name="company" placeholder="Distribution Co." required maxLength={FIELD_LIMITS.COMPANY} />
              <Field label="Country" name="country" placeholder="DE" required maxLength={FIELD_LIMITS.COMPANY} />
              <Field label="Email" name="email" type="email" placeholder="buyer@yourdistribution.eu" required maxLength={FIELD_LIMITS.EMAIL} className="sm:col-span-2" />
              <Field label="Phone (optional)" name="phone" placeholder="+49 30 1234 5678" maxLength={FIELD_LIMITS.PHONE} className="sm:col-span-2" />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Brands of interest
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_INDEX.map((b) => (
                  <label
                    key={b.id}
                    className="cursor-pointer rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input type="checkbox" name="brand" value={b.id} className="sr-only" />
                    {b.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Volume estimate
              </label>
              <div className="flex flex-wrap gap-1.5">
                {["Sample box", "200-500", "500-2,000", "2,000-10,000", "10,000+"].map((v) => (
                  <label
                    key={v}
                    className="cursor-pointer rounded-full border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
                  >
                    <input type="radio" name="volume" value={v} className="sr-only" />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Anything else
              </label>
              <textarea
                name="notes"
                rows={4}
                maxLength={FIELD_LIMITS.MESSAGE}
                placeholder="Country mix, retail channel, timing…"
                className="w-full rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
            </div>

            {/* Honeypot — hidden from humans, irresistible to bots. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor={HONEYPOT_FIELD}>Website</label>
              <input
                id={HONEYPOT_FIELD}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full"
              disabled={pending || submitted}
            >
              {submitted
                ? "Brief received ✓ — we'll reply within 1 business day"
                : pending
                ? "Sending…"
                : "Send brief"}
              {!submitted && !pending && <ArrowRightIcon />}
            </Button>
            {failed && (
              <div
                role="alert"
                className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
              >
                Sorry — your inquiry could not be sent. Please email us directly
                at{" "}
                <a className="underline" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
                . Your entries are still here — nothing was lost on your side.
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              By submitting you confirm you are a B2B buyer and agree to our Privacy Policy.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  className,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  maxLength?: number;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength} />
    </div>
  );
}
