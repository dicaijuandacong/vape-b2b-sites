#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 queries.json 生成 gosom 查询文件：'vape shop in {city}, {Country}'"""
import json
from pathlib import Path

EN = {"GB":"United Kingdom","DE":"Germany","FR":"France","ES":"Spain","IT":"Italy","PL":"Poland",
"NL":"Netherlands","BE":"Belgium","PT":"Portugal","CZ":"Czechia","AT":"Austria","CH":"Switzerland",
"SE":"Sweden","DK":"Denmark","FI":"Finland","NO":"Norway","IE":"Ireland","GR":"Greece","HU":"Hungary",
"RO":"Romania","BG":"Bulgaria","HR":"Croatia","SK":"Slovakia","SI":"Slovenia","EE":"Estonia",
"LV":"Latvia","LT":"Lithuania","RS":"Serbia","UA":"Ukraine","MT":"Malta","CY":"Cyprus","LU":"Luxembourg"}

cfg = json.loads(Path("queries.json").read_text(encoding="utf-8"))
lines = []
for label, info in cfg["countries"].items():
    cc = info["code"]
    country_en = EN[cc]
    kws = cfg["keywords_by_market"].get(cc, cfg["keywords_by_market"]["default"])
    for city in info["cities"]:
        for kw in kws:
            lines.append(f"{kw} in {city}, {country_en}")
Path("queries.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"queries.txt: {len(lines)} queries")

# 小样：单城市验证链路
Path("queries-test.txt").write_text(
    "vape shop in Tallinn, Estonia\nvape shop in Riga, Latvia\n", encoding="utf-8")
print("queries-test.txt: 2 queries")
