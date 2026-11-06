"use client";

import { useState } from "react";
import Image from "next/image";

export type FlavorImage = {
  flavor: string;
  src: string | null;
  hasReal: boolean;
};

type Props = {
  defaultSrc: string | null;
  flavors: FlavorImage[];
  productLabel: string;
};

const VISIBLE_THUMBS = 12;

export function ProductGallery({ defaultSrc, flavors, productLabel }: Props) {
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const activeImg =
    selectedFlavor === null
      ? defaultSrc
      : flavors.find((f) => f.flavor === selectedFlavor)?.src ?? defaultSrc;

  const altLabel =
    selectedFlavor === null ? productLabel : `${productLabel} — ${selectedFlavor}`;

  const visibleFlavors = showAll ? flavors : flavors.slice(0, VISIBLE_THUMBS);
  const hiddenCount = Math.max(0, flavors.length - VISIBLE_THUMBS);

  return (
    <div className="lg:sticky lg:top-32">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 30%, rgba(0,255,255,0.10) 0%, transparent 60%), radial-gradient(50% 50% at 80% 80%, rgba(91,108,255,0.10) 0%, transparent 65%)",
          }}
        />
        {activeImg ? (
          <Image
            key={activeImg}
            src={activeImg}
            alt={altLabel}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            No imagery yet
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {flavors.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {flavors.length} flavors
            </h3>
            {!showAll && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Show all {flavors.length}
              </button>
            )}
            {showAll && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Show less
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {/* Default thumbnail (resets selection) */}
            <button
              type="button"
              onClick={() => setSelectedFlavor(null)}
              aria-label={`Show default ${productLabel} image`}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                selectedFlavor === null
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border/60 hover:border-border"
              }`}
            >
              {defaultSrc ? (
                <Image
                  src={defaultSrc}
                  alt={`${productLabel} default`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-card text-[8px] uppercase tracking-wider text-muted-foreground">
                  default
                </div>
              )}
            </button>

            {visibleFlavors.map(({ flavor, src, hasReal }) => {
              const active = selectedFlavor === flavor;
              return (
                <button
                  key={flavor}
                  type="button"
                  onClick={() => setSelectedFlavor(flavor)}
                  aria-label={`Show ${flavor} image`}
                  title={flavor}
                  className={`group/thumb relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                    active
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={flavor}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-card px-1 text-center text-[8px] uppercase tracking-wider text-muted-foreground">
                      {flavor}
                    </div>
                  )}
                  {hasReal && (
                    <span
                      aria-hidden
                      className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
                    />
                  )}
                </button>
              );
            })}

            {!showAll && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/60 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                +{hiddenCount}
              </button>
            )}
          </div>

          {/* Active flavor label */}
          <div className="mt-2 text-xs text-muted-foreground">
            {selectedFlavor ? (
              <>
                Viewing: <span className="text-foreground">{selectedFlavor}</span>
              </>
            ) : (
              <span>Default product image</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
