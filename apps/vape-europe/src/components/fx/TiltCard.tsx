"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Maximum rotation in degrees (default 8°). */
  intensity?: number;
  /** Optional href turning the wrapper into an anchor. */
  href?: string;
};

/**
 * 3D perspective tilt on hover — NFT-marketplace card hover.
 * Tracks pointer within the element bounds and tilts the card on X/Y axes.
 * Auto-disables on coarse pointers (touch) and reduced-motion users.
 */
export function TiltCard({ children, className, intensity = 8, href }: Props) {
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [active, setActive] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fineMotion = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fineMotion && !reduceMotion);
  }, []);

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (!enabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    // Map [0,1] → [-1,1] then scale by intensity.
    setTilt({
      x: (py - 0.5) * -2 * intensity,
      y: (px - 0.5) * 2 * intensity,
    });
  }

  function onLeave() {
    setActive(false);
    setTilt({ x: 0, y: 0 });
  }

  const style: React.CSSProperties = enabled
    ? {
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${active ? "scale(1.02)" : "scale(1)"}`,
        transition: active ? "transform 80ms ease-out" : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }
    : {};

  const commonProps = {
    onPointerMove: onMove,
    onPointerEnter: () => setActive(true),
    onPointerLeave: onLeave,
    style,
    className: cn(className),
  };

  if (href) {
    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    );
  }

  return <div {...commonProps}>{children}</div>;
}
