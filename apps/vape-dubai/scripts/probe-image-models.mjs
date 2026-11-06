#!/usr/bin/env node
/**
 * Probe https://zz.erdogai.com to find which image-generation models are actually
 * available behind the user's API key.
 *
 * USAGE (PowerShell):
 *   $env:IMAGE2_KEY = "sk-..."
 *   node scripts/probe-image-models.mjs
 *
 * It first hits /v1/models, lists everything, then highlights image-* and known
 * image model name patterns.
 */

const KEY = process.env.IMAGE2_KEY;
if (!KEY) {
  console.error("Missing IMAGE2_KEY env var.");
  process.exit(1);
}

const BASE = "https://zz.erdogai.com";

const KNOWN_IMAGE_PATTERNS = [
  /^dall-?e/i,
  /^gpt-image/i,
  /^flux/i,
  /^stable-?diffusion/i,
  /^sdxl/i,
  /^sd[-]?\d/i,
  /^imagen/i,
  /^gemini.*image/i,
  /^nano-banana/i,
  /^seedream/i,
  /^seedance/i,
  /^kolors/i,
  /^kling/i,
  /^playground/i,
  /^ideogram/i,
  /^recraft/i,
  /^midjourney/i,
  /-image-/i,
  /image-\d/i,
];

(async () => {
  const res = await fetch(`${BASE}/v1/models`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const json = await res.json();
  const models = json.data ?? json.models ?? [];
  if (!models.length) {
    console.log("No models returned. Raw:");
    console.log(JSON.stringify(json, null, 2).slice(0, 2000));
    return;
  }
  const ids = models.map((m) => m.id ?? m.name ?? m).sort();
  const matches = ids.filter((id) =>
    KNOWN_IMAGE_PATTERNS.some((re) => re.test(id))
  );
  console.log(`\nTotal models exposed: ${ids.length}`);
  console.log(`\nLikely IMAGE generation models (${matches.length}):`);
  matches.forEach((id) => console.log(`  • ${id}`));
  console.log(`\nFull model list (first 80):`);
  ids.slice(0, 80).forEach((id) => console.log(`  - ${id}`));
  if (ids.length > 80) console.log(`  ... and ${ids.length - 80} more`);
})();
