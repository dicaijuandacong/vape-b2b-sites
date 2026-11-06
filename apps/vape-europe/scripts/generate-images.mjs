#!/usr/bin/env node
/**
 * Generate hero / lifestyle / brand cover images via image-2 endpoint.
 *
 * Run by user (gated — sends API key to external endpoint).
 * Endpoint: https://zz.erdogai.com/v1/images/generations (OpenAI-compatible)
 *
 * USAGE (PowerShell):
 *   $env:IMAGE2_KEY = "sk-..."
 *   node scripts/generate-images.mjs
 *
 * USAGE (bash):
 *   IMAGE2_KEY="sk-..." node scripts/generate-images.mjs
 *
 * Output: public/generated/<slug>.png
 *
 * Palette (NFT marketplace inspired — locked):
 *   - background: near-black blue-grey #0a0d18
 *   - accent: bright neon yellow-green #daff44 (no gold, no amber, no blue)
 *   - text: white #ffffff
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "generated");

const KEY = process.env.IMAGE2_KEY;
const MODEL = process.env.IMAGE2_MODEL ?? "gpt-image-2";
// Default endpoint for this project = zz.erdogai.com (matches the key the user
// uses for vapsolo-site image gen). Override with IMAGE2_BASE env if swapping.
const BASE = process.env.IMAGE2_BASE ?? "https://zz.erdogai.com";
if (!KEY) {
  console.error("Missing IMAGE2_KEY env var. Aborting.");
  process.exit(1);
}
console.log(`[cfg] base=${BASE}  model=${MODEL}`);

fs.mkdirSync(OUT, { recursive: true });

// All prompts emphasize device + abstract studio composition. NO people.
// NO youth-coded styling. Adult, professional, premium product photography vibe.
// Single-accent palette: neon yellow-green #daff44 only. Background near-black #0a0d18.
const PALETTE = "near-black background (#0a0d18, very dark blue-grey almost black), neon yellow-green accent (#daff44, bright lime, more yellow than green), white text only, NO blue, NO gold, NO amber, NO orange";

const PROMPTS = [
  {
    slug: "hero-main",
    size: "1536x1024",
    prompt:
      `Hero shot of a sleek matte-black modern e-cigarette pod device suspended in mid-air against a ${PALETTE} studio backdrop, abstract geometric light streaks in neon yellow-green sweeping behind it, ultra-sharp product photography, soft rim light, shallow depth of field, no people, ultra-premium aesthetic, 4k, cinema lighting, hint of subtle vapor trail`,
  },
  {
    slug: "lifestyle-warehouse",
    size: "1536x1024",
    prompt:
      `Wide-angle photograph of an immaculate modern logistics warehouse interior at twilight, ${PALETTE}, neon yellow-green accent strips along high-rack shelving, palletized cardboard cartons stacked geometrically, no people, premium DTC distribution facility aesthetic, futuristic but realistic, 4k industrial photography`,
  },
  {
    slug: "lifestyle-lab",
    size: "1536x1024",
    prompt:
      `Macro close-up of clean stainless-steel laboratory equipment for liquid testing, glass beakers with neon yellow-green liquid, ${PALETTE}, no people, scientific laboratory aesthetic, sharp focus, premium pharma-grade visual, no smoke or vapor visible`,
  },
  {
    slug: "brand-vozol",
    size: "1024x1024",
    prompt:
      `Product hero shot of a matte-black sculpted modern pod-style e-cigarette device standing upright on a reflective dark surface, ${PALETTE}, subtle neon yellow-green back-rim light, no people, luxury product photography, sharp lighting, premium 4k`,
  },
  {
    slug: "brand-vapen",
    size: "1024x1024",
    prompt:
      `Product hero shot of a translucent dark e-cigarette pod device upright, faint internal neon yellow-green glow, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "brand-waspe",
    size: "1024x1024",
    prompt:
      `Product hero shot of a glossy black e-cigarette pod device with a single neon yellow-green LED indicator strip, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "brand-fumot",
    size: "1024x1024",
    prompt:
      `Product hero shot of a deep matte-black cylindrical e-cigarette device with subtle mesh detail visible at the top, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "brand-jnr",
    size: "1024x1024",
    prompt:
      `Product hero shot of a premium black e-cigarette device with leather-wrap texture detail and a thin neon yellow-green seam, ${PALETTE}, soft spotlight, premium product photography, no people, 4k`,
  },
  {
    slug: "brand-razzbar",
    size: "1024x1024",
    prompt:
      `Product hero shot of a sculpted black-and-graphite e-cigarette pod device with neon yellow-green underglow, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "brand-vapme",
    size: "1024x1024",
    prompt:
      `Product hero shot of a diamond-cut crystal-textured matte-black e-cigarette pod device, subtle neon yellow-green rim accent, ${PALETTE}, premium product photography, no people, 4k`,
  },

  // -------------------------------------------------------------------------
  // PER-SKU product images for the high-traffic surfaces (ThreeHero,
  // FeaturedSpotlight, TopMovers). Same NFT palette as brand covers so they
  // sit consistently next to brand-* images. Each prompt encodes the SKU's
  // distinguishing feature (puff count, shell material, screen, etc.) so the
  // 7 cards stop looking like the same brand image cloned.
  // -------------------------------------------------------------------------
  {
    slug: "product-jnr-windwhip-44000",
    size: "1024x1024",
    prompt:
      `Product hero shot of a tall premium e-cigarette pod device with a wrap of stitched matte-black leather around its body, a small rectangular smart screen on the front displaying a faint neon yellow-green readout, slim breathing-light strip glowing soft neon yellow-green at the base, ${PALETTE}, ultra-sharp luxury product photography, soft rim light, no people, 4k`,
  },
  {
    slug: "product-razzbar-65k",
    size: "1024x1024",
    prompt:
      `Product hero shot of an oversized chunky bar-style e-cigarette device standing upright, exaggerated capacity body, single neon yellow-green LED stripe along the spine, small Type-C charging port visible at the base, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-vapme-crystal-48k",
    size: "1024x1024",
    prompt:
      `Product hero shot of a tall diamond-cut frosted crystal-textured matte-black e-cigarette pod device, large rectangular display panel on the front showing a faint neon yellow-green icon, faceted geometric shell catching subtle highlights, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-fumot-tornado-14000",
    size: "1024x1024",
    prompt:
      `Product hero shot of a deep matte-black cylindrical e-cigarette device, swirling tornado-style spiral pattern subtly etched around the body, mesh detail visible at the top airflow, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-vapen-storm-pro",
    size: "1024x1024",
    prompt:
      `Product hero shot of a sculpted matte-black e-cigarette pod device with sharp angular shoulders and a thin neon yellow-green lightning-bolt accent line running diagonally across the body, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-waspe-iris",
    size: "1024x1024",
    prompt:
      `Product hero shot of a glossy black e-cigarette pod device with a circular iris-shaped neon yellow-green LED indicator on the front, smooth rounded body, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-jnr-magic-vape-45000",
    size: "1024x1024",
    prompt:
      `Product hero shot of a tall premium e-cigarette pod device with a transparent liquid-window strip running vertically down the front showing a faint neon yellow-green tinted reservoir inside, leather-textured matte-black grip around the body, Type-C port at base, ${PALETTE}, premium product photography, no people, 4k`,
  },
  {
    slug: "product-vapme-digital-50k",
    size: "1024x1024",
    prompt:
      `Product hero shot of a tall premium e-cigarette pod device with a large rectangular digital display screen taking up the full upper face showing faint neon yellow-green readouts (battery icon, puff counter, mesh coil indicator), sleek matte-black body with subtle frosted finish, Type-C port at base, ${PALETTE}, premium product photography, no people, 4k`,
  },
];

async function generate(p) {
  const dest = path.join(OUT, `${p.slug}.png`);
  if (fs.existsSync(dest) && !process.env.IMAGE2_FORCE) {
    console.log(`[skip] ${p.slug}.png already exists (set IMAGE2_FORCE=1 to overwrite)`);
    return;
  }
  console.log(`[gen] ${p.slug} (${p.size})…`);
  const res = await fetch(`${BASE}/v1/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: p.prompt,
      size: p.size,
      n: 1,
      quality: process.env.IMAGE2_QUALITY ?? "high",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const url = json?.data?.[0]?.url ?? json?.data?.[0]?.b64_json;
  if (!url) {
    throw new Error(`No image URL in response: ${JSON.stringify(json).slice(0, 300)}`);
  }
  if (url.startsWith("http")) {
    const imgRes = await fetch(url);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(dest, buf);
  } else {
    fs.writeFileSync(dest, Buffer.from(url, "base64"));
  }
  console.log(`[ok]   ${p.slug}.png`);
}

(async () => {
  for (const p of PROMPTS) {
    try {
      await generate(p);
    } catch (e) {
      console.error(`[err] ${p.slug}:`, e.message);
    }
  }
  console.log("Done.");
})();
