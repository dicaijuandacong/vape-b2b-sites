import type { Metadata, Viewport } from "next";
import { Orbitron, Inter, JetBrains_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
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
import { NeonRail } from "@/components/site/NeonRail";
import { CursorSpotlight } from "@/components/fx/CursorSpotlight";
import { SITE } from "@/lib/site";
import { PRODUCTS_STATS } from "@/lib/data";
import { ConsentAnalytics } from "@/components/site/ConsentAnalytics";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.domain;
const SKU_COUNT = PRODUCTS_STATS.total_products;

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
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
    default: "DubaiVape Supply — Wholesale Vape Distributor for Dubai, UAE & GCC",
    template: "%s · DubaiVape Supply",
  },
  description:
    `Dubai wholesale vape distributor. 14 manufacturer-grade brands, ${SKU_COUNT} flagship SKUs, ESMA-conforming stock in Jebel Ali with same-day Dubai delivery and 2-4 day GCC shipping.`,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    title: "DubaiVape Supply — Wholesale Vape Distributor for Dubai, UAE & GCC",
    description:
      `Wholesale vape distribution for UAE and Gulf retailers. 14 manufacturer-grade brands, ${SKU_COUNT} flagship SKUs, Jebel Ali warehouse, same-day Dubai delivery.`,
    type: "website",
    locale: "en_AE",
    images: [
      {
        url: "/og-default.svg",
        width: 1200,
        height: 630,
        alt: "DubaiVape Supply — Dubai wholesale vape distributor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DubaiVape Supply — Wholesale Vape Distributor for Dubai, UAE & GCC",
    description:
      `Wholesale vape distribution for UAE and Gulf retailers. 14 brands, ${SKU_COUNT} SKUs, Jebel Ali warehouse.`,
    images: ["/og-default.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0221",
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
      className={cn("dark", orbitron.variable, inter.variable, jetbrains.variable, plexArabic.variable)}
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
            <NeonRail />
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
