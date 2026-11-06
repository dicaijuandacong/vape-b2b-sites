"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Max translation distance in px (default 6). */
  strength?: number;
  /** Activation radius in px (default 80). */
  radius?: number;
};

/**
 * Subtle magnetic hover — wraps any element. Mouse within `radius` of the
 * element's center pulls the element up to `strength` px toward the cursor.
 * Returns to (0,0) on mouse leave with a smooth spring.
 *
 * Designed for primary CTAs only. Off on touch / reduced-motion.
 */
export function MagneticButton({
  children,
  className,
  strength = 14,
  radius = 110,
}: Props) {
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
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const r = radius + Math.max(rect.width, rect.height) / 2;
      if (dist > r) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          el.style.transform = "translate3d(0,0,0)";
        });
        return;
      }
      const tx = (dx / r) * strength;
      const ty = (dy / r) * strength;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    }
    function onLeave() {
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.transform = "translate3d(0,0,0)";
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [radius, strength]);

  return (
    <div
      ref={ref}
      className={cn(
        "inline-block transition-transform duration-300 ease-out will-change-transform",
        className
      )}
    >
      {children}
    </div>
  );
}
