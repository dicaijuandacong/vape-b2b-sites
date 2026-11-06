"""Patch null puffs values with conservative reads from 3x PDF renders.

Based on legible spec column at 3x scale for VOZOL/Vapen/WASPE page 2 layout.
Conservative: only fills puffs where it's visually obvious from the catalog.
"""

from __future__ import annotations
import json, pathlib

DATA = pathlib.Path(r"E:\project\<legacy-project>\vapsolo-site\data\products.json")

# Patches keyed by product id. Source: 3x renders at data/pdf-pages-3x/.
PATCHES = {
    # Vapen — page 1 of Vapen at 3x clearly shows "FLOW 40K"
    "vapen-flow": {"puffs": 40000, "category": "rechargeable-disposable", "confidence": "medium"},
    "vapen-titan-x": {"puffs": 30000, "category": "rechargeable-disposable", "confidence": "medium"},
    "vapen-detroyx": {"puffs": 30000, "category": "rechargeable-disposable", "confidence": "medium"},
    "vapen-storm-pro": {"puffs": 28000, "category": "rechargeable-disposable", "confidence": "medium"},
    "vapen-r-liquid": {
        # R-LIQUID is a 10ml refill bottle, not a device — null puffs is correct
        "puffs": None,
        "category": "open-system",
        "design_notes": "10ml e-liquid refill bottle (not a device). Compatible with open-system pod kits.",
        "confidence": "medium",
    },
    # WASPE page 2 row 1-5 puff column (clearly shown at 3x): 50K, 50K, 30K, 25K, 20K
    "waspe-zora": {"puffs": 50000, "category": "rechargeable-disposable", "confidence": "medium"},
    "waspe-iris": {"puffs": 50000, "category": "rechargeable-disposable", "confidence": "medium"},
    "waspe-eris": {"puffs": 30000, "category": "rechargeable-disposable", "confidence": "medium"},
    "waspe-aria": {"puffs": 25000, "category": "rechargeable-disposable", "confidence": "medium"},
    "waspe-bri":  {"puffs": 20000, "category": "rechargeable-disposable", "confidence": "medium"},
}

with DATA.open("r", encoding="utf-8") as f:
    doc = json.load(f)

patched = 0
for brand in doc["brands"]:
    for p in brand["products"]:
        patch = PATCHES.get(p["id"])
        if patch:
            for k, v in patch.items():
                p[k] = v
            patched += 1

with DATA.open("w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

print(f"Patched {patched} products.")
print(f"Wrote {DATA}.")
