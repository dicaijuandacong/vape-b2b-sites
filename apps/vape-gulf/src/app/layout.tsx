import type { Metadata, Viewport } from "next";
import { Marcellus, Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { PromoMarquee } from "@/components/site/PromoMarquee";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { CookieConsent } from "@/components/site/CookieConsent";
import { organizationLd } from "@/lib/jsonld";
import { CountryProvider } from "@/lib/country-context";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { CursorSpotlight } from "@/components/fx/CursorSpotlight";
import { SITE } from "@/lib/site";
import { PRODUCTS_STATS } from "@/lib/data";
import { ConsentAnalytics } from "@/components/site/ConsentAnalytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.domain;
const SKU_COUNT = PRODUCTS_STATS.total_products;

const marcellus = Marcellus({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GulfVape Trading — Wholesale Vape Distributor for Saudi Arabia & GCC",
    template: "%s · GulfVape Trading",
  },
  description:
    `Saudi wholesale vape distributor. 14 manufacturer-grade brands, \${SKU_COUNT} flagship SKUs, SFDA / SASO conforming stock in Riyadh with 2-3 day Kingdom-wide and 3-5 day GCC shipping.`,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "GulfVape Trading — Wholesale Vape Distributor for Saudi Arabia & GCC",
    description:
      `Wholesale vape distribution for Saudi and Gulf retailers. 14 manufacturer-grade brands, \${SKU_COUNT} flagship SKUs, Riyadh bonded warehouse, 2-3 day KSA delivery.`,
    type: "website",
    locale: "en_SA",
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "GulfVape Trading — Saudi wholesale vape distributor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GulfVape Trading — Wholesale Vape Distributor for Saudi Arabia & GCC",
    description:
      `Wholesale vape distribution for Saudi and Gulf retailers. 14 brands, \${SKU_COUNT} SKUs, Riyadh warehouse.`,
    images: ["/og-default.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0C120E",
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
      className={cn("dark", marcellus.variable, inter.variable, jetbrains.variable, plexArabic.variable)}
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
