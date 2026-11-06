#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按 place_id 计算还没跑完的邮箱查询，写 queries-remaining.txt（给自愈循环用）。

匹配键说明：爬虫输出的 link 会追加 ?authuser=0&hl=en 等参数，跟输入 link 对不上；
place_id 两边稳定（500/500 命中），用它对齐。"""
import csv, glob
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
FULL = OUT / "vape-europe-full.csv"        # place_id ↔ link 权威映射
QUERIES = HERE / "queries-email.txt"       # 目标集合（有网站的 5089 条直链）
EMAILS = sorted(glob.glob(str(OUT / "emails-*.csv")))

# link → place_id
link_pid = {}
with FULL.open(encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        pid = (r.get("place_id") or "").strip()
        link = (r.get("link") or "").strip()
        if pid and link and link not in link_pid:
            link_pid[link] = pid

# 已跑过的 place_id（历次 email 输出，成败都算——网站挂了的重试也没用）
done = set()
for f in EMAILS:
    with open(f, encoding="utf-8-sig", newline="") as fh:
        for r in csv.DictReader(fh):
            pid = (r.get("place_id") or "").strip()
            if pid:
                done.add(pid)

targets = [l.strip() for l in QUERIES.read_text(encoding="utf-8").splitlines() if l.strip()]
remaining = [l for l in targets if link_pid.get(l) not in done]
(HERE / "queries-remaining.txt").write_text(
    "\n".join(remaining) + ("\n" if remaining else ""), encoding="utf-8")
print(f"目标 {len(targets)} · 已跑 {len(done)} · 剩余 {len(remaining)}")
