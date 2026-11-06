import { LogoMark } from "@/components/icons";

/**
 * NFT marketplace signature: circular repeating text element.
 * "LIVE EU INVENTORY · LIVE EU INVENTORY · DDP · ..." spinning around the V logo.
 */
export function LiveAuctionsRing({ className = "" }: { className?: string }) {
  const text = "LIVE JEBEL ALI INVENTORY · SAME-DAY DUBAI · GCC 2–4 DAYS · ";
  // Repeat 3x so the ring fills evenly
  const full = (text + text + text).slice(0, -1);

  return (
    <div className={`relative inline-flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56 ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full animate-[spin_28s_linear_infinite]"
        aria-hidden
      >
        <defs>
          <path
            id="ring-path"
            d="M 100 100 m -82, 0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0"
          />
        </defs>
        <text fill="currentColor" fontSize="11" fontWeight="600" letterSpacing="3">
          <textPath href="#ring-path" startOffset="0">
            {full}
          </textPath>
        </text>
      </svg>
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-card shadow-[0_0_36px_-8px_rgba(0,255,255,0.5)]">
        <LogoMark className="h-7 w-7" />
      </div>
    </div>
  );
}
