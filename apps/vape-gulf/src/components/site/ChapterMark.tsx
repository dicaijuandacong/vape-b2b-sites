"use client";

import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Large, faint chapter numeral with a serif eyebrow label beneath.
 * The pacing device of the "luxury catalog" — 01 / 02 / 03.
 */
export function ChapterMark({
  number,
  labelKey,
}: {
  number: string;
  labelKey: string;
}) {
  const { t } = useLocale();
  return (
    <div className="text-center">
      <div className="font-display text-7xl font-thin tracking-tight text-primary/15 sm:text-8xl">
        {number}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {t(labelKey)}
      </p>
    </div>
  );
}
