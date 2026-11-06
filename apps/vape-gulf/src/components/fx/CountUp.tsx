"use client";

import * as React from "react";

type Props = {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
};

/**
 * Number that animates from 0 to `to` when it enters the viewport.
 * Uses requestAnimationFrame, easeOutCubic. Renders the final value during SSR
 * (no flicker) until hydration starts the animation.
 */
export function CountUp({ to, duration = 1400, suffix = "", prefix = "", className }: Props) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [value, setValue] = React.useState(to);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    setValue(0);
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Math.round(eased * to));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
