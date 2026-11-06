import { ImageResponse } from "next/og";
import { getBrand } from "@/lib/data";

export const runtime = "edge";
export const alt = "EuroVape Supply brand catalog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG_GRADIENT = "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)";
const LIME = "#2563EB";
const GOLD = "#93C5FD";
const FG = "#f7f8fb";
const MUTED = "rgba(247, 248, 251, 0.62)";
const CHIP_BG = "rgba(197, 240, 54, 0.10)";
const CHIP_BORDER = "rgba(197, 240, 54, 0.32)";

function LogoMarkOG({ scale = 1 }: { scale?: number }) {
  const s = 96 * scale;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="og-v-brand" x1="20" y1="40" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor={LIME} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <path
        d="M32 46 L93 162 a12 12 0 0 0 22 0 l10 -20 -21 -10 -10 12 L52 38 Z"
        fill="url(#og-v-brand)"
      />
      <path
        d="M120 132 L165 46 h22 l-52 104 Z"
        fill="url(#og-v-brand)"
        opacity="0.92"
      />
      <circle cx="152" cy="86" r="10" fill={LIME} />
      <circle cx="172" cy="68" r="7.5" fill={LIME} opacity="0.78" />
      <circle cx="188" cy="52" r="5.5" fill={LIME} opacity="0.55" />
    </svg>
  );
}

type Params = { slug: string };

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const brand = getBrand(slug);

  // Fallback content if brand can't be found at OG-render time.
  const name = brand?.name ?? "Brand";
  const tagline = brand?.tagline ?? "European wholesale vape distributor";
  const skuCount = brand?.products.length ?? 0;
  const flavorCount = brand
    ? new Set(brand.products.flatMap((p) => p.flavors.map((f) => f.toLowerCase()))).size
    : 0;
  const categoryCount = brand
    ? new Set(brand.products.map((p) => p.category)).size
    : 0;

  // Truncate name if extremely long to keep layout safe.
  const displayName = name.length > 26 ? name.slice(0, 25) + "…" : name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG_GRADIENT,
          color: FG,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: "60px 80px",
        }}
      >
        {/* Top-right radial glow */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -260,
            width: 720,
            height: 720,
            borderRadius: 720,
            background:
              "radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.06) 40%, rgba(0,0,0,0) 70%)",
            display: "flex",
          }}
        />

        {/* Top brand strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 22,
              letterSpacing: 1.2,
              color: MUTED,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <LogoMarkOG scale={0.55} />
            <span style={{ display: "flex" }}>
              EuroVape<span style={{ color: LIME }}>.</span>Supply · Brand
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: MUTED,
              fontWeight: 500,
              letterSpacing: 0.4,
            }}
          >
            europevapesupplier.com/brands/{slug}
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 48,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: LIME,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Brand Catalog
          </div>
          <div
            style={{
              fontSize: 124,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.0,
              marginTop: 18,
              display: "flex",
              maxWidth: 1040,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 32,
              color: "rgba(247,248,251,0.78)",
              fontWeight: 500,
              lineHeight: 1.3,
              maxWidth: 980,
              display: "flex",
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Stat row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 22px",
            borderRadius: 999,
            background: CHIP_BG,
            border: `1px solid ${CHIP_BORDER}`,
            color: LIME,
            fontSize: 24,
            fontWeight: 600,
            alignSelf: "flex-start",
          }}
        >
          {skuCount} SKUs · {flavorCount} flavors · {categoryCount} categor
          {categoryCount === 1 ? "y" : "ies"}
        </div>
      </div>
    ),
    { ...size }
  );
}
