import * as React from "react";
import { cn } from "@/lib/utils";

type IconProps = React.SVGProps<SVGSVGElement>;

export function LogoMark({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={cn("h-7 w-7", className)}
      {...props}
    >
      <defs>
        <linearGradient id="lg-fill" x1="2" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D9B45B" />
          <stop offset="1" stopColor="#17C97B" />
        </linearGradient>
      </defs>
      {/* Stylized V: solid left stroke, dissolving right stroke */}
      <path
        d="M5.2 7.5 14.5 26a2 2 0 0 0 3.6 0l1.6-3.2-3.4-1.7L16 24 8.5 6Z"
        fill="url(#lg-fill)"
      />
      <path
        d="M19.4 21.1 26.2 7.5h3.3l-7.7 15.4Z"
        fill="url(#lg-fill)"
        opacity="0.9"
      />
      {/* Particle trail — vapor diffusion */}
      <circle cx="24.5" cy="14" r="1.6" fill="#D9B45B" />
      <circle cx="27.8" cy="11.2" r="1.2" fill="#D9B45B" opacity="0.75" />
      <circle cx="30.4" cy="8.6" r="0.9" fill="#D9B45B" opacity="0.5" />
      <circle cx="32.4" cy="6.4" r="0.6" fill="#D9B45B" opacity="0.3" />
    </svg>
  );
}

export function LogoMarkSquare({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={cn("h-9 w-9", className)}
      {...props}
    >
      <defs>
        <linearGradient id="lg-fill-sq" x1="6" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D9B45B" />
          <stop offset="1" stopColor="#17C97B" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="#0C120E" />
      <path
        d="M8.2 10.5 15.4 25a1.6 1.6 0 0 0 2.9 0l1.3-2.6-2.8-1.4L16.7 23 11 9Z"
        fill="url(#lg-fill-sq)"
      />
      <path
        d="M19.6 21.5 25 10.5h2.7l-6.3 12.6Z"
        fill="url(#lg-fill-sq)"
        opacity="0.9"
      />
      <circle cx="23.6" cy="15.5" r="1.4" fill="#D9B45B" />
      <circle cx="26.4" cy="13.1" r="1" fill="#D9B45B" opacity="0.75" />
      <circle cx="28.6" cy="10.9" r="0.7" fill="#D9B45B" opacity="0.5" />
    </svg>
  );
}

export function LogoLockup({ className, ...props }: IconProps & { textClassName?: string }) {
  const { textClassName, ...rest } = props as IconProps & { textClassName?: string };
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark {...rest} />
      <span className={cn("font-display text-lg font-semibold tracking-tight", textClassName)}>
        GulfVape<span className="text-primary">.</span>Trading
      </span>
    </span>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 6v6c0 4.97 3.4 9.18 8 10 4.6-.82 8-5.03 8-10V6l-8-3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.5 12 2 2 3.5-4" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21c4-1 7.5-3 10-7s4-9 4-12c-3 0-8 1-12 4S2 14 5 17c1 1 2 1 3 1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21 17 9" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />
    </svg>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M3 7.5 12 12m9-4.5L12 12m0 0v9" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function VapePodIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <rect x="8" y="3" width="8" height="14" rx="2" />
      <rect x="9.5" y="6" width="5" height="6" rx="1" />
      <path strokeLinecap="round" d="M9 17v3M15 17v3" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2 13h12l2-9H7" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" strokeLinecap="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Tiny social icon set
export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.07A10 10 0 1 0 10.5 22v-7H8v-3h2.5V9.5C10.5 7 12 5.5 14.3 5.5c.85 0 1.7.16 1.7.16v2.4h-1.2c-1.2 0-1.6.75-1.6 1.5V12H16l-.4 3h-2.1v7A10 10 0 0 0 22 12.07Z" />
    </svg>
  );
}
export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}
export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 4.5A1.5 1.5 0 1 1 4 7.5 1.5 1.5 0 0 1 4 4.5ZM3 9h2v11H3V9Zm5 0h2v1.5c.5-1 1.7-1.7 3-1.7 3 0 3.5 2 3.5 4.5V20h-2v-6c0-1.5-.4-2.5-2-2.5s-2 1-2 2.5V20H8V9Z" />
    </svg>
  );
}
export function TiktokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 3v3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.3V16a6 6 0 1 1-6-6c.35 0 .68.03 1 .1v3.07A3 3 0 1 0 13 16V3h3Z" />
    </svg>
  );
}

// Compliance badges
export function TpdBadge({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 28" className={cn("h-7", className)} {...props}>
      <rect width="64" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="32" y="18" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10" fill="currentColor">SFDA</text>
    </svg>
  );
}
export function MhraBadge({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 72 28" className={cn("h-7", className)} {...props}>
      <rect width="72" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="36" y="18" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10" fill="currentColor">SASO</text>
    </svg>
  );
}
export function CeBadge({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 28" className={cn("h-7", className)} {...props}>
      <rect width="64" height="28" rx="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="32" y="18" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="currentColor">CE / UKCA</text>
    </svg>
  );
}
export function WeeeBadge({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" className={cn("h-7 w-7", className)} {...props}>
      <path d="M9 4h10l-1 4h-8l-1-4Zm-1 6h12l-1 13a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2L8 10Zm6-2v-2" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 22 4-4M24 22l-4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Payment methods (mono — colorless brand-mark approximations)
export function PayVisa(props: IconProps) {
  return (
    <svg viewBox="0 0 48 16" fill="currentColor" {...props}>
      <text x="24" y="13" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontStyle="italic" fontSize="14">VISA</text>
    </svg>
  );
}
export function PayMastercard(props: IconProps) {
  return (
    <svg viewBox="0 0 36 24" fill="none" {...props}>
      <circle cx="13" cy="12" r="9" fill="currentColor" opacity="0.85" />
      <circle cx="23" cy="12" r="9" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
export function PayAmex(props: IconProps) {
  return (
    <svg viewBox="0 0 48 16" fill="currentColor" {...props}>
      <text x="24" y="13" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11">AMEX</text>
    </svg>
  );
}
export function PayPayPal(props: IconProps) {
  return (
    <svg viewBox="0 0 48 16" fill="currentColor" {...props}>
      <text x="24" y="13" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontStyle="italic" fontSize="11">PayPal</text>
    </svg>
  );
}
export function PayKlarna(props: IconProps) {
  return (
    <svg viewBox="0 0 48 16" fill="currentColor" {...props}>
      <text x="24" y="13" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11">Klarna</text>
    </svg>
  );
}
export function PayWire(props: IconProps) {
  return (
    <svg viewBox="0 0 56 16" fill="currentColor" {...props}>
      <text x="28" y="13" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10">SEPA / Wire</text>
    </svg>
  );
}
