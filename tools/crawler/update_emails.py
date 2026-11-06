#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import os
把 -email 模式抓到的邮箱按 place_id 回写进飞书 prospects 表的「邮箱」字段。
用法:
  python update_emails.py out/vape-europe-emails.csv           # 真回写
  python update_emails.py out/vape-europe-emails.csv --dry-run # 只统计

行为:
  1. 读 email CSV，取 place_id + emails（取第一个可用邮箱）
  2. 拉飞书全表，建 place_id → record_id 映射
  3. 只更新「邮箱为空且抓到了邮箱」的行（不覆盖运营手填的）
"""
import csv, json, re, sys, time, urllib.request
from pathlib import Path

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
APP = os.environ["FEISHU_BITABLE_APP_TOKEN"]
TBL = os.environ["FEISHU_TABLE_ID"]
BASE = "https://open.feishu.cn/open-apis"
BATCH = 100

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
            if attempt == retries:
                raise
            time.sleep(1.5 * (attempt + 1))

def as_text(v):
    if v is None: return ""
    if isinstance(v, str): return v
    if isinstance(v, list): return "".join(as_text(x) for x in v)
    if isinstance(v, dict):
        return str(v.get("text") or v.get("link") or "")
    return str(v)

def pick_first_email(raw):
    """gosom 的 emails 列是逗号分隔串；也可能混进 '[/...]' 之类的噪声 —— 正则提纯取第一个。"""
    m = EMAIL_RE.search(raw or "")
    return m.group(0) if m else ""

def main():
    dry = "--dry-run" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")]
    pid_to_email = {}
    for f in files:
        with open(f, encoding="utf-8-sig", newline="") as fh:
            for row in csv.DictReader(fh):
                pid = (row.get("place_id") or "").strip()
                email = pick_first_email(row.get("emails", ""))
                if pid and email and pid not in pid_to_email:
                    pid_to_email[pid] = email
    print(f"CSV 中抓到邮箱的店: {len(pid_to_email)}")

    T = tenant_token()
    # 拉全表建映射
    pid_to_rid, existing_email = {}, set()
    token = None
    while True:
        url = f"{BASE}/bitable/v1/apps/{APP}/tables/{TBL}/records?page_size=500" + (f"&page_token={token}" if token else "")
        r = urllib.request.Request(url, headers={"Authorization": f"Bearer {T}"})
        d = json.loads(urllib.request.urlopen(r, timeout=30).read().decode())
        if d["code"] != 0:
            print("list error:", d["msg"]); sys.exit(1)
        for it in d["data"].get("items", []):
            pid = as_text(it.get("fields", {}).get("place_id")).strip()
            if not pid or not it.get("record_id"): continue
            pid_to_rid[pid] = it["record_id"]
            if as_text(it.get("fields", {}).get("邮箱")).strip():
                existing_email.add(pid)
        if not d["data"].get("has_more"): break
        token = d["data"]["page_token"]
    print(f"飞书表记录: {len(pid_to_rid)}，已有邮箱: {len(existing_email)}")

    todo = [(pid_to_rid[p], e) for p, e in pid_to_email.items()
            if p in pid_to_rid and p not in existing_email]
    print(f"待回写: {len(todo)} 条")
    if dry or not todo:
        return

    ok = fail = 0
    for i in range(0, len(todo), BATCH):
        chunk = [{"record_id": rid, "fields": {"邮箱": email}} for rid, email in todo[i:i+BATCH]]
        try:
            d = req("POST", f"/bitable/v1/apps/{APP}/tables/{TBL}/records/batch_update", T, {"records": chunk})
            if d.get("code") == 0: ok += len(chunk)
            else: fail += len(chunk); print(f"batch {i//BATCH} error: {d.get('code')} {d.get('msg')}")
        except Exception as e:
            fail += len(chunk); print(f"batch {i//BATCH} exception: {e}")
        time.sleep(0.3)
    print(f"回写完成: ok={ok} fail={fail}")

if __name__ == "__main__":
    main()
