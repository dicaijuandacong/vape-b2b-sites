import Link from "next/link";
import {
  LogoLockup,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
  PayVisa,
  PayMastercard,
  PayAmex,
  PayPayPal,
  PayKlarna,
  PayWire,
} from "@/components/icons";
import { BRAND_INDEX } from "@/lib/data";

const COLS = [
  {
    title: "Catalog",
    links: [
      { label: "Browse all SKUs", href: "/products" },
      { label: "All 14 brands", href: "/brands" },
      { label: "Sample boxes", href: "/wholesale#sample-box" },
      { label: "Full catalog & prices", href: "/catalog" },
      { label: "Private label", href: "/wholesale#private-label" },
    ],
  },
  {
    title: "Wholesale",
    links: [
      { label: "Become a distributor", href: "/wholesale" },
      { label: "Pricing tiers", href: "/wholesale#pricing" },
      { label: "GCC shipping", href: "/wholesale#shipping" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact sales", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About DubaiVape", href: "/about" },
      { label: "Brands portfolio", href: "/brands" },
      { label: "Press / media", href: "/about#press" },
      { label: "Privacy & cookies", href: "/legal/privacy" },
    ],
  },
];

const SOCIALS = [
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "TikTok", href: "#", Icon: TiktokIcon },
];

export function Footer() {
  return (
    <footer className="bg-card text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,3fr)]">
          {/* Brand column */}
          <div>
            <LogoLockup className="text-foreground" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Dubai wholesale distributor for next-generation vapor brands. Jebel Ali warehouse,
              same-day UAE delivery, single PO across 14 manufacturer lines.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-background/40 text-xs">
              <a
                href="tel:+971400000000"
                className="flex items-center gap-3 px-4 py-3 text-foreground transition-colors hover:bg-background/70"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <span className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Direct line</span>
                  <span className="font-mono text-sm tracking-wide">+971 4 000 0000</span>
                </span>
              </a>
              <a
                href="https://wa.me/971500000000?text=Hi%20DubaiVape%2C%20I%27m%20interested%20in%20wholesale%20pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 border-t border-border/60 px-4 py-3 text-foreground transition-colors hover:bg-[#25D366]/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                  </svg>
                </span>
                <span className="flex flex-1 items-center justify-between">
                  <span className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">WhatsApp</span>
                    <span className="text-sm font-medium">Chat on WhatsApp</span>
                  </span>
                  <span className="text-base text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground">→</span>
                </span>
              </a>
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
                Jebel Ali stocking partner
              </p>
              <p className="mt-1.5">
                Authorised reseller of <span className="text-foreground">VOZOL · Vapen · WASPE · FUMOT · JNR · Razzbar · VAPME</span>.
                Warehouse in Jebel Ali Free Zone (Dubai, AE).
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Brand quick links */}
        <div className="mt-16 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BRAND_INDEX.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.slug}`}
              className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <span>{b.name}</span>
              <span className="font-mono text-[10px] tracking-[0.18em]">{b.product_count} SKUs</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom bar — minimal: copyright, legal, payments. No big health warning. */}
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} DubaiVape Supply.</span>
            <span className="opacity-60">Wholesale only · 18+</span>
            <Link href="/legal/terms" className="link-underline transition-colors hover:text-foreground">Terms</Link>
            <Link href="/legal/privacy" className="link-underline transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/legal/cookies" className="link-underline transition-colors hover:text-foreground">Cookies</Link>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground/70">
            <span className="text-[10px] uppercase tracking-[0.18em]">Payment</span>
            <PayVisa className="h-4 text-current" />
            <PayMastercard className="h-5 text-current" />
            <PayAmex className="h-4 text-current" />
            <PayPayPal className="h-4 text-current" />
            <PayKlarna className="h-4 text-current" />
            <PayWire className="h-4 text-current" />
          </div>
        </div>
      </div>
    </footer>
  );
}
