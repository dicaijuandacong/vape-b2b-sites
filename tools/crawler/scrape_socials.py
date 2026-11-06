#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从每个店的官网抓社媒链接 + 联系页邮箱。
直连（店官网可直连，无需代理）；16 线程；输出 out/socials.csv。
列: place_id, instagram, facebook, tiktok, twitter, telegram, whatsapp, extra_emails
"""
import csv, json, re, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse
import urllib.request


HERE = Path(__file__).parent
OUT = HERE / "out" / "socials.csv"
WORKERS = 16
TIMEOUT = 10
CONTACT_PATHS = ["/contact", "/contact-us", "/kontakt", "/contacts", "/impressum", "/about"]

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
SOCIAL_RES = [
    ("instagram", re.compile(r"https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.\-/]+", re.I)),
    ("facebook",  re.compile(r"https?://(?:www\.|m\.)?facebook\.com/[A-Za-z0-9_.\-/]+", re.I)),
    ("tiktok",    re.compile(r"https?://(?:www\.)?tiktok\.com/@?[A-Za-z0-9_.\-/]+", re.I)),
    ("twitter",   re.compile(r"https?://(?:www\.)?(?:twitter|x)\.com/[A-Za-z0-9_]+", re.I)),
    ("telegram",  re.compile(r"https?://(?:www\.)?(?:t\.me|telegram\.me)/[A-Za-z0-9_]+", re.I)),
    ("whatsapp",  re.compile(r"https?://(?:wa\.me|api\.whatsapp\.com/send\?phone=)[0-9]+", re.I)),
]
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# 图片/CSS 等资源链接模式不算
SKIP_SUBSTR = ["javascript:", "mailto:", "tel:"]

def fetch(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            if r.status != 200 or r.headers.get("Content-Type", "").startswith(("image/", "video/", "application/pdf")):
                return ""
            raw = r.read(400_000)  # 400KB 够找联系方式了
            charset = r.headers.get_content_charset() or "utf-8"
            try:
                return raw.decode(charset, errors="ignore")
            except LookupError:
                return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def extract(html, base_url):
    """从 HTML 里提取社媒链接 + mailto/正文邮箱。"""
    found = {}
    for name, rex in SOCIAL_RES:
        for m in rex.finditer(html):
            u = m.group(0).rstrip("/.")
            if any(s in u for s in ("/sharer", "/share", "/intent", "/plugins", "/dialog", "/tr?", "privacy", "legal", "help.instagram")):
                continue
            found.setdefault(name, set()).add(u)
    emails = set(EMAIL_RE.findall(html))
    for m in re.finditer(r"mailto:([^\"'?&\s]+)", html, re.I):
        e = EMAIL_RE.search(m.group(1))
        if e: emails.add(e.group(0))
    # 过滤常见误报
    emails = {e for e in emails if not re.search(r"\.(png|jpg|jpeg|gif|webp|css|js)$", e, re.I) and "example" not in e and "sentry" not in e and "wixpress" not in e}
    return found, emails

def process(pid, site):
    out = {"place_id": pid, "instagram": "", "facebook": "", "tiktok": "", "twitter": "", "telegram": "", "whatsapp": "", "extra_emails": ""}
    host = urlparse(site).netloc.lower()
    # 店家把 wa.me / 社媒本身当官网填的 —— 抓了只会收到平台自己的链接，跳过
    if any(h in host for h in ("wa.me", "whatsapp.com", "facebook.com", "instagram.com", "linktr.ee")):
        return out
    html = fetch(site)
    if not html:
        return out
    found, emails = extract(html, site)
    # 首页没找齐社媒/邮箱 → 试联系页（最多探 3 个常见路径，探到一个有内容的就收）
    if not emails or len(found) < 2:
        root = f"{urlparse(site).scheme}://{urlparse(site).netloc}"
        for p in CONTACT_PATHS[:3]:
            chtml = fetch(root + p)
            if not chtml: continue
            f2, e2 = extract(chtml, root + p)
            for k, v in f2.items(): found.setdefault(k, set()).update(v)
            emails |= e2
            if emails and len(found) >= 2: break
    for k in ("instagram", "facebook", "tiktok", "twitter", "telegram", "whatsapp"):
        if k in found: out[k] = " ".join(sorted(found[k])[:3])
    if emails: out["extra_emails"] = " ".join(sorted(emails)[:3])
    return out

def main():
    delta_path = HERE / "out" / "socials-delta.json"
    if delta_path.exists():
        # 增量模式：只跑 delta（GCC/MENA 新店的官网）
        targets = [(d["place_id"], d["website"]) for d in json.loads(delta_path.read_text(encoding="utf-8"))]
    else:
        full = list(csv.DictReader(open(HERE / "out" / "vape-europe-full.csv", encoding="utf-8-sig")))
        targets = [(r["place_id"].strip(), r["website"].strip()) for r in full
                   if (r.get("website") or "").startswith("http") and (r.get("place_id") or "").strip()]
    print(f"目标 {len(targets)} 个官网，{WORKERS} 线程直连抓取…")

    done_pids = set()
    if OUT.exists():
        with OUT.open(encoding="utf-8-sig", newline="") as f:
            for r in csv.DictReader(f):
                if r.get("place_id"): done_pids.add(r["place_id"])
    targets = [t for t in targets if t[0] not in done_pids]
    print(f"跳过已完成 {len(done_pids)}，本轮 {len(targets)}")

    mode = "a" if done_pids else "w"
    n = ok = 0
    with OUT.open(mode, encoding="utf-8", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=["place_id","instagram","facebook","tiktok","twitter","telegram","whatsapp","extra_emails"])
        if mode == "w": w.writeheader()
        with ThreadPoolExecutor(max_workers=WORKERS) as ex:
            futs = {ex.submit(process, pid, site): pid for pid, site in targets}
            for fut in as_completed(futs):
                try:
                    row = fut.result()
                except Exception:
                    row = {"place_id": futs[fut], "instagram": "", "facebook": "", "tiktok": "", "twitter": "", "telegram": "", "whatsapp": "", "extra_emails": ""}
                w.writerow(row); fo.flush()
                n += 1
                if any(v for k, v in row.items() if k != "place_id"): ok += 1
                if n % 200 == 0: print(f"  {n}/{len(targets)} 完成，有收获 {ok}")
    print(f"完成：{n} 个官网，{ok} 个抓到至少一种联系方式")

if __name__ == "__main__":
    sys.exit(main())
