#!/usr/bin/env node
/**
 * Dump every expected filename for the per-flavor image system.
 *
 * Output:
 *   data/expected-flavor-images.txt   (one filename per line, sorted by brand → SKU → flavor)
 *   data/expected-flavor-images.csv   (productId, flavor, filename)
 *
 * Drop a PNG matching any of these names into `public/generated/` and the
 * site auto-picks it up via lib/img.ts → productOrBrandImg(p.id, brand, flavor).
 *
 * Run:  node scripts/dump-flavor-manifest.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "products.json"), "utf8"));

function flavorSlug(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const txtLines = [];
const csvLines = ["productId,flavor,filename"];
let totalFlavors = 0;
let totalSkus = 0;

txtLines.push("# Vaporforge EU — expected per-flavor image filenames");
txtLines.push(`# Generated ${new Date().toISOString()}`);
txtLines.push(`# Drop matching PNGs into public/generated/ — site auto-detects.`);
txtLines.push(`# Naming convention: product-{sku-id}-{flavor-kebab}.png`);
txtLines.push("");

for (const brand of products.brands) {
  txtLines.push(`# ===== ${brand.name} (${brand.products.length} SKUs) =====`);
  for (const p of brand.products) {
    totalSkus++;
    txtLines.push("");
    txtLines.push(`# ${brand.name} ${p.model}  (id: ${p.id})  ${p.flavors.length} flavors`);
    txtLines.push(`product-${p.id}.png   # SKU-level fallback (already exists for top movers)`);
    for (const flavor of p.flavors) {
      totalFlavors++;
      const fname = `product-${p.id}-${flavorSlug(flavor)}.png`;
      txtLines.push(fname);
      csvLines.push(`${p.id},"${flavor.replace(/"/g, '""')}",${fname}`);
    }
  }
  txtLines.push("");
}

txtLines.unshift("");
txtLines.unshift(
  `# TOTAL: ${totalSkus} SKUs × variable flavors = ${totalFlavors} per-flavor images`
);
txtLines.unshift(`#          + ${totalSkus} per-SKU fallback images`);

const outTxt = path.join(ROOT, "data", "expected-flavor-images.txt");
const outCsv = path.join(ROOT, "data", "expected-flavor-images.csv");
fs.writeFileSync(outTxt, txtLines.join("\n"));
fs.writeFileSync(outCsv, csvLines.join("\n"));

console.log(`[ok] ${outTxt}`);
console.log(`[ok] ${outCsv}`);
console.log(`[stats] ${totalSkus} SKUs · ${totalFlavors} flavors · ${totalFlavors + totalSkus} expected filenames total`);
