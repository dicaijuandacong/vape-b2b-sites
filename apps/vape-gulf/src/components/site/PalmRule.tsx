/**
 * Regional anchor — a date-palm motif (the Saudi national tree) rendered
 * as a minimal gold-stroked inline SVG, used as a restrained section
 * break. Pairs with the champagne-gold palette.
 */
export function PalmRule({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-4 py-10 text-primary/50 ${className}`}
    >
      <span className="h-px w-16 bg-primary/30 sm:w-24" />
      <svg
        viewBox="0 0 48 56"
        className="h-10 w-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* crown of fronds */}
        <path d="M24 20 C18 12 10 10 5 13 C9 15 14 16 24 20 Z" />
        <path d="M24 20 C30 12 38 10 43 13 C39 15 34 16 24 20 Z" />
        <path d="M24 20 C19 10 20 4 24 2 C28 4 29 10 24 20 Z" />
        <path d="M24 20 C14 16 6 18 3 23 C8 22 15 22 24 20 Z" />
        <path d="M24 20 C34 16 42 18 45 23 C40 22 33 22 24 20 Z" />
        {/* trunk */}
        <path d="M24 20 L23 54 M24 20 L25 54" />
        <path d="M22 30 L26 30 M22 38 L26 38 M22 46 L26 46" />
      </svg>
      <span className="h-px w-16 bg-primary/30 sm:w-24" />
    </div>
  );
}
