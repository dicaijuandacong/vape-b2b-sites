/**
 * A short, centered champagne-gold hairline — the gallery catalog's
 * chapter separator. Restrained: 1px, ~96px wide, 60% opacity.
 */
export function GoldRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`mx-auto h-px w-24 bg-primary/60 ${className}`} />
  );
}
