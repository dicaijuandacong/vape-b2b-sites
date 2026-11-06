"use client";

import * as React from "react";

/**
 * 8 tiny lime particles floating in the hero. Random initial positions, each
 * with its own slow CSS keyframe drift. Pointer-events none. SSR-safe (positions
 * generated client-side after mount to avoid hydration mismatch).
 */
export function HeroParticles({ count = 8 }: { count?: number }) {
  const [particles, setParticles] = React.useState<
    { x: number; y: number; size: number; duration: number; delay: number }[]
  >([]);

  React.useEffect(() => {
    const arr = Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 14 + Math.random() * 10,
      delay: Math.random() * -20,
    }));
    setParticles(arr);
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: 0.45,
            boxShadow: "0 0 10px rgba(217,180,91,0.85)",
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
