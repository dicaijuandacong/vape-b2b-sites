"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Fade-up + 12px translate when the element enters the viewport.
 *
 * Uses a callback ref (more reliable than useRef + useEffect across Next.js
 * client-component boundaries) and immediately falls back to "shown" if the
 * IntersectionObserver API is unavailable or already past the element on mount.
 */
export function RevealOnScroll({ children, delay = 0, className }: Props) {
  const [shown, setShown] = React.useState(false);

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      if (shown) return;

      // No IO support → render immediately
      if (typeof IntersectionObserver === "undefined") {
        setShown(true);
        return;
      }

      // Already in (or above) viewport on mount → render immediately
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh - 32) {
        setShown(true);
        return;
      }

      const obs = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              setShown(true);
              obs.disconnect();
              break;
            }
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
      );
      obs.observe(node);
    },
    [shown]
  );

  return (
    <div
      ref={setRef}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
