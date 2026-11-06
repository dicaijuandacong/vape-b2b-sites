import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { PromoMarquee } from "@/components/site/PromoMarquee";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { CookieConsent } from "@/components/site/CookieConsent";
import { ConsentAnalytics } from "@/components/site/ConsentAnalytics";
import { organizationLd } from "@/lib/jsonld";
import { CountryProvider } from "@/lib/country-context";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { CursorSpotlight } from "@/components/fx/CursorSpotlight";
import { SITE } from "@/lib/site";
import { PRODUCTS_STATS } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.domain;
const SKU_COUNT = PRODUCTS_STATS.total_products;

/* Linear-style: Inter everywhere, tight tracking does the display work. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const interDisplay = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EuroVape Supply — Wholesale Vape Supplier for European Small Retail",
    template: "%s · EuroVape Supply",
  },
  description:
    `European wholesale vape supplier for independent retailers. 14 manufacturer-grade brands, ${SKU_COUNT} flagship SKUs, EU warehouse with DDP shipping in 5-7 days. B2B from 50 units.`,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "EuroVape Supply — Wholesale Vape Supplier for European Small Retail",
    description:
      `Wholesale vape supply for European independent retailers. 14 brands, ${SKU_COUNT} flagship SKUs, EU warehouse, DDP shipping. B2B from 50 units.`,
    type: "website",
    locale: "en_EU",
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "EuroVape Supply — European wholesale vape supplier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EuroVape Supply — Wholesale Vape Supplier for European Small Retail",
    description:
      `Wholesale vape supply for European retailers. 14 brands, ${SKU_COUNT} SKUs, B2B from 50 units.`,
    images: ["/og-default.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F8FAFC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, interDisplay.variable, jetbrains.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased font-sans ambient-noise">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }}
        />
        <LocaleProvider>
          <CountryProvider>
            <ScrollProgress />
            <CursorSpotlight />
            <Header />
            <PromoMarquee />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
            <FloatingWhatsApp />
            <CookieConsent />
          </CountryProvider>
        </LocaleProvider>
        {/* Analytics only loads after explicit cookie consent (A4). */}
        <ConsentAnalytics />
      </body>
    </html>
  );
}
