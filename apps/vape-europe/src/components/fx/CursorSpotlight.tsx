"use client";

import * as React from "react";

/**
 * Page-wide cursor-following spotlight. Pointer-events none, sits behind
 * content with mix-blend-mode: lighten so it just adds light, never blocks.
 * Disabled on touch devices and reduced-motion.
 */
export function CursorSpotlight() {
  const ref = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    if (window.matchMedia?.("(pointer: coarse)")?.matches) return;

    function onMove(e: PointerEvent) {
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = `translate3d(${e.clientX - 140}px, ${e.clientY - 140}px, 0)`;
      });
    }

    function onLeave() {
      if (!el) return;
      el.style.opacity = "0";
    }

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[280px] w-[280px] rounded-full opacity-0 transition-opacity duration-300 will-change-transform"
      style={{
        background:
          "radial-gradient(closest-side, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0.03) 35%, transparent 70%)",
        mixBlendMode: "lighten",
      }}
    />
  );
}
