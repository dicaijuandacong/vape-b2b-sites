"use client";

import * as React from "react";

/**
 * Thin neon vertical rail pinned to the inline-start edge (left in LTR,
 * right in Arabic RTL — uses logical `start-0`). A glow fills from the top
 * to track scroll progress. Pure decoration (aria-hidden).
 *
 * Signature of the Dubai "neon editorial night" design.
 */
export function NeonRail() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 start-0 z-40 w-px"
    >
      {/* base track */}
      <div className="absolute inset-0 bg-primary/10" />
      {/* progress glow */}
      <div
        className="absolute inset-x-0 top-0 bg-primary transition-[height] duration-150 ease-out"
        style={{
          height: `${progress}%`,
          boxShadow: "0 0 14px 0 var(--color-primary), 0 0 28px -4px var(--color-primary)",
        }}
      />
    </div>
  );
}
