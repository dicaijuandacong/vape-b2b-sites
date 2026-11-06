#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import os
socials.csv → 飞书 prospects 表社媒列回写。
- Instagram/Facebook/TikTok/Telegram/X推特：写第一条链接（url 字段格式）
- extra_emails：只补「邮箱为空」的行，不覆盖已有
用法: python update_socials.py [--dry-run]
"""
import csv, json, re, sys, time, urllib.request
from pathlib import Path

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
APP = os.environ["FEISHU_BITABLE_APP_TOKEN"]
TBL = os.environ["FEISHU_TABLE_ID"]
BASE = "https://open.feishu.cn/open-apis"
BATCH = 100
HERE = Path(__file__).parent

PLATFORM_COL = {"instagram": "Instagram", "facebook": "Facebook", "tiktok": "TikTok",
                "telegram": "Telegram", "twitter": "X推特"}
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

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

def main():
    dry = "--dry-run" in sys.argv
    # 1) socials.csv → place_id → fields
    soc = {}
    with (HERE / "out" / "socials.csv").open(encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            pid = (r.get("place_id") or "").strip()
            if not pid: continue
            fields = {}
            for src, col in PLATFORM_COL.items():
                link = (r.get(src) or "").split()[0] if (r.get(src) or "").strip() else ""
                if link: fields[col] = {"link": link, "text": link}
            m = EMAIL_RE.search(r.get("extra_emails") or "")
            if m: fields["__email"] = m.group(0)
            if fields: soc[pid] = fields
    print(f"socials.csv 有收获: {len(soc)} 家")

    # 2) 拉飞书全表 → place_id → record_id + 已有邮箱
    T = tenant_token()
    pid_rid, has_email = {}, set()
    token = None
    while True:
        url = f"{BASE}/bitable/v1/apps/{APP}/tables/{TBL}/records?page_size=500" + (f"&page_token={token}" if token else "")
        r = urllib.request.Request(url, headers={"Authorization": f"Bearer {T}"})
        d = json.loads(urllib.request.urlopen(r, timeout=30).read().decode())
        if d["code"] != 0: print("list err:", d["msg"]); sys.exit(1)
        for it in d["data"].get("items", []):
            pid = as_text(it.get("fields", {}).get("place_id")).strip()
            if not pid or not it.get("record_id"): continue
            pid_rid[pid] = it["record_id"]
            if as_text(it.get("fields", {}).get("邮箱")).strip(): has_email.add(pid)
        if not d["data"].get("has_more"): break
        token = d["data"]["page_token"]

    # 3) 组装更新（社媒全量写；邮箱只补空）
    updates = []
    stats = {c: 0 for c in list(PLATFORM_COL.values()) + ["邮箱"]}
    for pid, fields in soc.items():
        if pid not in pid_rid: continue
        rec = {}
        for col in PLATFORM_COL.values():
            if col in fields:
                rec[col] = fields[col]; stats[col] += 1
        if "__email" in fields and pid not in has_email:
            rec["邮箱"] = fields["__email"]; stats["邮箱"] += 1
        if rec: updates.append({"record_id": pid_rid[pid], "fields": rec})
    print(f"待更新: {len(updates)} 家；分平台: {stats}")
    if dry or not updates: return

    ok = fail = 0
    for i in range(0, len(updates), BATCH):
        try:
            d = req("POST", f"/bitable/v1/apps/{APP}/tables/{TBL}/records/batch_update", T,
                    {"records": updates[i:i+BATCH]})
            if d.get("code") == 0: ok += len(updates[i:i+BATCH])
            else: fail += len(updates[i:i+BATCH]); print("err:", d.get("code"), d.get("msg"))
        except Exception as e:
            fail += len(updates[i:i+BATCH]); print("exception:", e)
        time.sleep(0.3)
    print(f"回写完成: ok={ok} fail={fail}")

if __name__ == "__main__":
    main()
