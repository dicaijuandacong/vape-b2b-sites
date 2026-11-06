"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon } from "@/components/icons";
import { BRANDS } from "@/lib/data";
import { useLocale } from "@/lib/i18n/locale-context";
import { SITE } from "@/lib/site";
import {
  FIELD_LIMITS,
  HONEYPOT_FIELD,
  isValidEmail,
} from "@/lib/form-validation";

export function Newsletter() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setFailed(false);
    setPending(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Honeypot rides along — the API silently drops bot submissions.
        body: JSON.stringify({ email, [HONEYPOT_FIELD]: website }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (res.ok && data?.ok) {
        setSubmitted(true);
      } else if (data?.error && data.error !== "delivery_failed") {
        setError(data.error);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-t border-border bg-background py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
        {/* LEFT — copy + form */}
        <div>
          <p className="section-eyebrow">
            {t("news.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {t("news.title.1")} <span className="text-primary">{t("news.title.2")}</span> {t("news.title.3")}
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            {t("news.body")}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-md flex-col gap-2">
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("news.placeholder")}
                className="h-12 rounded-full px-5 sm:flex-1"
                aria-label="Email address"
                maxLength={FIELD_LIMITS.EMAIL}
                disabled={pending || submitted}
              />
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-full"
                disabled={pending || submitted}
              >
                {submitted
                  ? t("news.cta.subscribed")
                  : pending
                    ? t("news.cta.subscribing")
                    : t("news.cta.subscribe")}
                {!submitted && !pending && <ArrowRightIcon />}
              </Button>
            </div>
            {/* Honeypot — hidden from humans, irresistible to bots. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor={HONEYPOT_FIELD}>Website</label>
              <input
                id={HONEYPOT_FIELD}
                name={HONEYPOT_FIELD}
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
            {failed && (
              <p className="text-xs leading-relaxed text-destructive" role="alert">
                Sorry — your subscription could not be saved. Please email us
                directly at{" "}
                <a className="underline" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
                .
              </p>
            )}
          </form>
        </div>

        {/* RIGHT — image collage with neon green ellipse (NFT marketplace signature) */}
        <NewsletterCollage />
      </div>
    </section>
  );
}

function NewsletterCollage() {
  const picks = BRANDS.slice(0, 4);
  const slots = [
    { rotate: "rotate-[-6deg]", offset: "translate-x-2 translate-y-4" },
    { rotate: "rotate-[5deg]",  offset: "translate-x-12 -translate-y-3" },
    { rotate: "rotate-[-3deg]", offset: "translate-x-4 translate-y-12" },
    { rotate: "rotate-[7deg]",  offset: "translate-x-16 translate-y-6" },
  ];
  return (
    <div className="relative mx-auto h-72 w-full max-w-md sm:h-80">
      {/* Neon green ellipse — NFT marketplace newsletter signature, slow rotation */}
      <svg
        viewBox="0 0 480 360"
        aria-hidden
        className="absolute inset-0 h-full w-full ellipse-spin"
        style={{ filter: "drop-shadow(0 0 18px rgba(217,180,91,0.5))" }}
      >
        <ellipse
          cx="240"
          cy="180"
          rx="200"
          ry="120"
          fill="none"
          stroke="#E7C568"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Stacked card collage — abstract gradient cards (no fs imports) */}
      <div className="relative flex h-full items-center justify-center">
        {picks.map((b, i) => {
          const s = slots[i] ?? slots[0];
          return (
            <div
              key={b.id}
              className={`absolute h-40 w-28 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_22px_50px_-25px_rgba(0,0,0,0.9)] ${s.rotate} ${s.offset} sm:h-44 sm:w-32`}
              style={{ insetInlineStart: `${15 + i * 18}%` }}
            >
              <div className="relative h-full w-full bg-gradient-to-br from-primary/25 via-card to-background">
                <div className="absolute left-1/2 top-1/2 h-3/5 w-1/4 -translate-x-1/2 -translate-y-1/2 rounded-md bg-foreground/8 ring-1 ring-foreground/15" />
                <div className="absolute inset-x-3 bottom-3 h-1.5 rounded-full bg-primary/60" />
                <div className="absolute right-2 top-2 font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/60">
                  {b.name.slice(0, 5)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
