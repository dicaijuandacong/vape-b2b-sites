"use client";

import * as React from "react";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  /** Dictionary key whose value is the scrolling label text. */
  textKey: string;
  className?: string;
};

/**
 * Big horizontal infinite-scroll label — brutalist NFT marketplace style.
 * Renders the text 6× to fill the loop without seams. CSS-only, no JS.
 * Resolves the text through the active locale (client island).
 */
export function InfiniteLabel({ textKey, className = "" }: Props) {
  const { t } = useLocale();
  const text = t(textKey);
  const items = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none relative flex w-full overflow-hidden text-foreground/[0.04] " +
        className
      }
    >
      <div
        className="flex shrink-0 items-center gap-8 whitespace-nowrap will-change-transform"
        style={{ animation: "infinite-label 28s linear infinite" }}
      >
        {items.map((i) => (
          <span
            key={i}
            className="font-display text-[10vw] font-bold leading-none tracking-tight uppercase"
          >
            {text} <span className="mx-4 text-primary/30">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
