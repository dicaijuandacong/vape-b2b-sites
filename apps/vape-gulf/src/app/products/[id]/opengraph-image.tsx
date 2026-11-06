import { ImageResponse } from "next/og";
import { getProduct, lowestTierMoq } from "@/lib/data";

export const runtime = "edge";
export const alt = "GulfVape Trading product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG_GRADIENT = "linear-gradient(135deg, #0C120E 0%, #131D17 60%, #080D0A 100%)";
const LIME = "#D9B45B";
const GOLD = "#17C97B";
const FG = "#f7f8fb";
const MUTED = "rgba(247, 248, 251, 0.62)";
const CHIP_BG = "rgba(197, 240, 54, 0.10)";
const CHIP_BORDER = "rgba(197, 240, 54, 0.32)";
const PILL_BG = "rgba(247, 248, 251, 0.08)";
const PILL_BORDER = "rgba(247, 248, 251, 0.18)";

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
        <linearGradient id="og-v-prod" x1="20" y1="40" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor={LIME} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      <path
        d="M32 46 L93 162 a12 12 0 0 0 22 0 l10 -20 -21 -10 -10 12 L52 38 Z"
        fill="url(#og-v-prod)"
      />
      <path
        d="M120 132 L165 46 h22 l-52 104 Z"
        fill="url(#og-v-prod)"
        opacity="0.92"
      />
      <circle cx="152" cy="86" r="10" fill={LIME} />
      <circle cx="172" cy="68" r="7.5" fill={LIME} opacity="0.78" />
      <circle cx="188" cy="52" r="5.5" fill={LIME} opacity="0.55" />
    </svg>
  );
}

type Params = { id: string };

const CATEGORY_LABEL: Record<string, string> = {
  "disposable": "Disposable",
  "rechargeable-disposable": "Rechargeable disposable",
  "pod-kit": "Pod kit",
  "prefilled-pod": "Prefilled pod",
  "open-system": "Open system",
  "shisha-style": "Shisha-style",
};

export default async function Image({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const found = getProduct(id);

  const product = found?.product;
  const brand = found?.brand;

  const model = product?.model ?? "Product";
  const brandName = product?.brand ?? brand?.name ?? "GulfVape";
  const puffs = product?.puffs ?? null;
  const categoryLabel = product
    ? CATEGORY_LABEL[product.category] ?? product.category
    : "";
  const flavors = (product?.flavors ?? []).slice(0, 6);
  const minMoq = product ? lowestTierMoq(product) : 0;

  const displayModel = model.length > 22 ? model.slice(0, 21) + "…" : model;

  // Build subtitle as a flat string to keep flex layout safe
  const subtitleParts: string[] = [brandName];
  if (puffs) subtitleParts.push(`${puffs.toLocaleString()} puffs`);
  if (categoryLabel) subtitleParts.push(categoryLabel);
  const subtitle = subtitleParts.join(" · ");

  // Pricing line — per-SKU prices are never shown publicly; MOQ + quote CTA only.
  const priceLine = `Wholesale pricing on request · MOQ ${minMoq.toLocaleString()} units`;

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
              "radial-gradient(circle, rgba(217,180,91,0.18) 0%, rgba(217,180,91,0.06) 40%, rgba(0,0,0,0) 70%)",
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
              GulfVape<span style={{ color: LIME }}>.</span>Trading · Product
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
            saudivapesupplier.com/products/{id}
          </div>
        </div>

        {/* Title block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
          }}
        >
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.0,
              display: "flex",
              maxWidth: 1040,
            }}
          >
            {displayModel}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 28,
              color: "rgba(247,248,251,0.78)",
              fontWeight: 500,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Flavor pills */}
        {flavors.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 28,
              maxWidth: 1040,
            }}
          >
            {flavors.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  background: PILL_BG,
                  border: `1px solid ${PILL_BORDER}`,
                  fontSize: 22,
                  color: FG,
                  fontWeight: 500,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 28 }} />
        )}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Bottom price chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 26px",
            borderRadius: 999,
            background: CHIP_BG,
            border: `1px solid ${CHIP_BORDER}`,
            color: LIME,
            fontSize: 26,
            fontWeight: 700,
            alignSelf: "flex-start",
          }}
        >
          {priceLine}
        </div>
      </div>
    ),
    { ...size }
  );
}
