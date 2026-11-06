"use client";

import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Regional anchor — a Dubai skyline silhouette (Burj Khalifa + skyline
 * outline) rendered as an inline neon-stroked SVG divider, with a short
 * bilingual tagline beneath. Pure CSS neon glow on the stroke.
 *
 * Signature of the Dubai "neon editorial night" design.
 */
export function SkylineDivider() {
  const { t } = useLocale();
  return (
    <section
      aria-label="Dubai skyline"
      className="relative isolate overflow-hidden border-y border-border bg-background py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <p className="max-w-xl font-display text-lg font-medium tracking-tight text-foreground/90 sm:text-xl">
            {t("dubai.tagline")}
          </p>
          <svg
            viewBox="0 0 1200 220"
            className="skyline-glow h-auto w-full max-w-4xl text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            aria-hidden
          >
            {/* Stylized Gulf skyline:Burj Khalifa center + flanking towers */}
            <path d="M0 220 V150 H60 V220 Z" />
            <path d="M70 220 V130 H120 V220 Z" />
            <path d="M130 220 V160 H180 V220 Z" />
            {/* Burj Khalifa — tapering spire */}
            <path d="M600 220 V120 L590 90 L595 60 L600 18 L605 60 L610 90 L600 120" />
            <path d="M560 220 V140 L575 110 L585 130 H615 L625 110 L640 140 V220 Z" />
            <path d="M575 150 H625 M570 175 H630 M565 200 H635" />
            {/* Right flank towers */}
            <path d="M700 220 V135 H750 V220 Z" />
            <path d="M760 220 V100 H790 L810 140 V220 Z" />
            <path d="M820 220 V155 H880 V220 Z" />
            <path d="M890 220 V120 H930 V220 Z" />
            <path d="M940 220 V165 H1010 V220 Z" />
            <path d="M1020 220 V140 H1080 V220 Z" />
            <path d="M1090 220 V170 H1150 V220 Z" />
            {/* twinkles */}
            <circle cx="600" cy="18" r="2.5" fill="currentColor" stroke="none" />
            <circle cx="300" cy="80" r="1.2" fill="currentColor" stroke="none" opacity="0.7" />
            <circle cx="900" cy="60" r="1.2" fill="currentColor" stroke="none" opacity="0.6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
