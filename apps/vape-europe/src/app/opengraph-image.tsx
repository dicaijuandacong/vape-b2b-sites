import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EuroVape Supply — European wholesale vape supplier";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette
const BG_GRADIENT = "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)";
const LIME = "#2563EB";
const GOLD = "#93C5FD";
const FG = "#f7f8fb";
const MUTED = "rgba(247, 248, 251, 0.62)";
const CHIP_BG = "rgba(197, 240, 54, 0.10)";
const CHIP_BORDER = "rgba(197, 240, 54, 0.32)";

// Reusable Vaporforge logomark rendered as raw JSX (subset of SVG that ImageResponse supports).
function LogoMarkOG({ scale = 1 }: { scale?: number }) {
  const s = 220 * scale;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="og-v" x1="20" y1="40" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor={LIME} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      {/* Solid left stroke of the V */}
      <path
        d="M32 46 L93 162 a12 12 0 0 0 22 0 l10 -20 -21 -10 -10 12 L52 38 Z"
        fill="url(#og-v)"
      />
      {/* Dissolving right stroke */}
      <path
        d="M120 132 L165 46 h22 l-52 104 Z"
        fill="url(#og-v)"
        opacity="0.92"
      />
      {/* Vapor particles */}
      <circle cx="152" cy="86" r="10" fill={LIME} />
      <circle cx="172" cy="68" r="7.5" fill={LIME} opacity="0.78" />
      <circle cx="188" cy="52" r="5.5" fill={LIME} opacity="0.55" />
      <circle cx="201" cy="40" r="4" fill={LIME} opacity="0.32" />
    </svg>
  );
}

export default async function Image() {
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
          padding: "72px 80px",
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
            gap: 14,
            fontSize: 22,
            letterSpacing: 1.2,
            color: MUTED,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 8,
              background: LIME,
              display: "flex",
            }}
          />
          EuroVape.Supply · Wholesale
        </div>

        {/* Main row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {/* Left text block */}
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <div
              style={{
                fontSize: 112,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.02,
                display: "flex",
              }}
            >
              <span>EuroVape</span>
              <span style={{ color: LIME }}>.</span>
              <span>EU</span>
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 36,
                color: "rgba(247,248,251,0.82)",
                fontWeight: 500,
                lineHeight: 1.25,
                display: "flex",
              }}
            >
              European wholesale vape distributor
            </div>
          </div>

          {/* Right logomark */}
          <div style={{ display: "flex", marginRight: 12 }}>
            <LogoMarkOG scale={1.4} />
          </div>
        </div>

        {/* Bottom-left chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 22px",
            borderRadius: 999,
            background: CHIP_BG,
            border: `1px solid ${CHIP_BORDER}`,
            color: LIME,
            fontSize: 22,
            fontWeight: 600,
            alignSelf: "flex-start",
          }}
        >
          TPD-notified · EU warehouse · DDP shipping
        </div>
      </div>
    ),
    { ...size }
  );
}
