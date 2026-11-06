"use client";

import * as React from "react";

/**
 * Top-of-page scroll progress bar (2px neon lime).
 * Fills left-to-right as the user scrolls. Subtle, NFT-marketplace tasteful.
 */
export function ScrollProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      setProgress(pct);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-primary transition-[transform] duration-150 ease-out"
        style={{
          transform: `scaleX(${progress / 100})`,
          boxShadow: "0 0 14px rgba(0,255,255,0.85), 0 0 4px rgba(0,255,255,0.6)",
        }}
      />
    </div>
  );
}
