#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import os
成功率增强：给 prospects 全表算「优先级」+ 提「痛点」+ 生成英文「开场白」。

评分（0-100，可解释）：
  规模：log10(评论数+1)*30  → 生意大小
  口碑：(评分-3)*10 尪到 0-15
  渠道：邮箱+10、Telegram+10、IG/FB 各+5（封顶20）
  营业：24h 营业 +10（流水大）
  专营：类目含 vaporizer/vape +10（vs 烟草杂货店）
  基础：有电话+10、有官网+5
分级：S≥75 A≥60 B≥45 其余 C

痛点：user_reviews 里 Rating<=3 的差评按关键词归类（断货/员工/价格/等待/假货/关门/品类少）
开场白：有痛点用痛点版（转化高），没有用通用版；{city} 缺省 European。
"""
import csv, json, math, re, sys, time, urllib.request
from pathlib import Path

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
APP = os.environ["FEISHU_BITABLE_APP_TOKEN"]
TBL = os.environ["FEISHU_TABLE_ID"]
BASE = "https://open.feishu.cn/open-apis"
BATCH = 100
HERE = Path(__file__).parent

PAINS = [
    ("断货缺货", r"out of stock|no stock|never have|sold out|availability|don't (?:have|carry)|doesn't (?:have|carry)"),
    ("店员服务", r"staff|rude|unfriendly|unhelpful|bad service|poor service|ignore"),
    ("价格贵",   r"expensive|pricey|overpriced|rip[- ]?off|too much"),
    ("等太久",   r"wait|queue|slow|queueing"),
    ("疑似假货", r"fake|counterfeit|knock[- ]?off|not authentic"),
    ("营业时间", r"closed|opening hours|shut early|never open"),
    ("品类太少", r"selection|range|variety|choice|limited stock"),
]
PAIN_EN = {
    "断货缺货": "stock running out", "店员服务": "service inconsistency", "价格贵": "pricing pressure",
    "等太久": "long waiting times", "疑似假货": "product authenticity concerns",
    "营业时间": "availability issues", "品类太少": "a limited product range",
}

def tenant_token():
    r = urllib.request.Request(BASE + "/auth/v3/tenant_access_token/internal",
        data=json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(r, timeout=30).read().decode())["tenant_access_token"]

def req(method, url, token, body=None, retries=2):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    for attempt in range(retries + 1):
        try:
            r = urllib.request.Request(BASE + url, data=data, method=method)
            r.add_header("Authorization", f"Bearer {token}")
            if data is not None:
                r.add_header("Content-Type", "application/json; charset=utf-8")
            with urllib.request.urlopen(r, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except Exception:
            if attempt == retries: raise
            time.sleep(1.5 * (attempt + 1))

def as_text(v):
    if v is None: return ""
    if isinstance(v, str): return v
    if isinstance(v, list): return "".join(as_text(x) for x in v)
    if isinstance(v, dict): return str(v.get("text") or v.get("link") or "")
    return str(v)

def parse_reviews(raw):
    if not raw or raw.strip() in ("", "[]"): return []
    try:
        arr = json.loads(raw)
        return arr if isinstance(arr, list) else []
    except Exception:
        return []

def find_pain(reviews):
    """从差评(Rating<=3)里按优先级找第一个命中的痛点类别。"""
    neg = [r.get("Description", "") for r in reviews
           if isinstance(r, dict) and isinstance(r.get("Rating"), (int, float)) and r["Rating"] <= 3]
    if not neg: return ""
    blob = " ".join(neg)[:4000]
    for cn, pattern in PAINS:
        if re.search(pattern, blob, re.I):
            return cn
    return ""

def score(row, has_email, has_tg, has_ig, has_fb):
    try: reviews_n = float(row.get("review_count") or 0)
    except ValueError: reviews_n = 0
    try: rating = float(row.get("review_rating") or 0)
    except ValueError: rating = 0
    s = min(math.log10(reviews_n + 1) / math.log10(3001), 1.0) * 30      # 规模 0-30
    s += max(0.0, min(15.0, (rating - 3.0) * 10)) if rating else 0        # 口碑 0-15
    s += (10 if has_email else 0) + (10 if has_tg else 0) + (5 if has_ig else 0) + (5 if has_fb else 0)
    if "24" in (row.get("open_hours") or ""): s += 10                     # 全天营业
    cat = (row.get("category") or "").lower()
    if "vapor" in cat or "vape" in cat: s += 10                           # 专营
    s += 10 if (row.get("phone") or "").strip() else 0
    s += 5 if (row.get("website") or "").startswith("http") else 0
    return int(s)

def grade(s):
    return "S" if s >= 75 else "A" if s >= 60 else "B" if s >= 45 else "C"

def opener(name, city, pain_cn):
    where = city or "European"
    if pain_cn:
        return (f"Hi {name} team — noticed a few of your Google reviews mention {PAIN_EN[pain_cn]}. "
                f"We help {where} vape shops keep shelves full with EU-compliant disposables "
                f"at wholesale prices. Mind if I send over our latest price list?")
    return (f"Hi {name} team — we're a wholesale supplier serving {where} vape shops "
            f"(EU-compliant disposables, e-liquids & accessories, MOQ-friendly). "
            f"Happy to send our latest price list?")

def main():
    dry = "--dry-run" in sys.argv
    # 1) 本地数据：全量 CSV（评论/类目/电话/网站/城市）+ socials（邮箱/TG/IG/FB）
    # 合并全部区域源（欧洲 + GCC + MENA）
    full = {}
    for name in ("vape-europe-full.csv", "vape-gcc.csv", "vape-mena.csv"):
        src = HERE / "out" / name
        if not src.exists(): continue
        for r in csv.DictReader(open(src, encoding="utf-8-sig", newline="")):
            pid = (r.get("place_id") or "").strip()
            if pid and pid not in full: full[pid] = r
    soc = {}
    sc_path = HERE / "out" / "socials.csv"
    if sc_path.exists():
        for r in csv.DictReader(open(sc_path, encoding="utf-8-sig", newline="")):
            pid = (r.get("place_id") or "").strip()
            if pid: soc[pid] = r

    # 2) 拉飞书全表 → place_id → record_id（+城市，CSV 里没有的用表里的）
    T = tenant_token()
    pid_rid, pid_city = {}, {}
    token = None
    while True:
        url = f"{BASE}/bitable/v1/apps/{APP}/tables/{TBL}/records?page_size=500" + (f"&page_token={token}" if token else "")
        d = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": f"Bearer {T}"}), timeout=30).read().decode())
        for it in d["data"].get("items", []):
            f = it.get("fields", {})
            pid = as_text(f.get("place_id")).strip()
            if pid and it.get("record_id"):
                pid_rid[pid] = it["record_id"]
                pid_city[pid] = as_text(f.get("城市")).strip()
        if not d["data"].get("has_more"): break
        token = d["data"]["page_token"]

    # 3) 计算
    updates, dist, pain_dist = [], {"S":0,"A":0,"B":0,"C":0}, {}
    for pid, rid in pid_rid.items():
        row = full.get(pid, {})
        srow = soc.get(pid, {})
        sc = score(row, bool((srow.get("extra_emails") or "").strip()),
                   bool((srow.get("telegram") or "").strip()),
                   bool((srow.get("instagram") or "").strip()),
                   bool((srow.get("facebook") or "").strip()))
        g = grade(sc); dist[g] += 1
        name = as_text(row.get("title")).strip() or "there"
        city = pid_city.get(pid) or (row.get("city") if isinstance(row.get("city"), str) else "") or ""
        pain = find_pain(parse_reviews(row.get("user_reviews", "")))
        if pain: pain_dist[pain] = pain_dist.get(pain, 0) + 1
        updates.append({"record_id": rid, "fields": {
            "优先级": g,
            **({"痛点": pain} if pain else {}),
            "开场白": opener(name, city, pain),
        }})
    print(f"待写: {len(updates)} 家；分级: {dist}；痛点分布: {pain_dist}")
    if dry: return

    ok = fail = 0
    for i in range(0, len(updates), BATCH):
        try:
            d = req("POST", f"/bitable/v1/apps/{APP}/tables/{TBL}/records/batch_update", T, {"records": updates[i:i+BATCH]})
            if d.get("code") == 0: ok += len(updates[i:i+BATCH])
            else: fail += len(updates[i:i+BATCH]); print("err:", d.get("code"), d.get("msg"))
        except Exception as e:
            fail += len(updates[i:i+BATCH]); print("exception:", e)
        time.sleep(0.3)
    print(f"写入完成: ok={ok} fail={fail}")

if __name__ == "__main__":
    main()
