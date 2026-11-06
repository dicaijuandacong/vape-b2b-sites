#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import os
maps-leads → 飞书 prospects 表写入器
用法:
  python upload_to_feishu.py results.csv            # 从 CSV 读（omkarcloud 爬虫输出格式 + 通用格式）
  python upload_to_feishu.py results.csv --dry-run  # 只统计不写入

行为:
  1. 读爬虫 CSV/JSON，容忍多种列名（name/full_address/phone/website/rating/reviews/…）
  2. place_id 去重（本地 state 文件 + 飞书已有记录）
  3. 分批写入 Bitable（每批 100 条），失败重试 2 次
"""
import csv, json, sys, time, urllib.request
from pathlib import Path

APP_ID = os.environ["FEISHU_APP_ID"]
APP_SECRET = os.environ["FEISHU_APP_SECRET"]
APP = os.environ["FEISHU_BITABLE_APP_TOKEN"]
TBL = os.environ["FEISHU_TABLE_ID"]
BASE = "https://open.feishu.cn/open-apis"
STATE = Path(__file__).parent / ".seen_place_ids.json"
BATCH = 100

def load_country_map():
    p = Path(__file__).with_name("queries.json")
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8")).get("country_name_zh_by_code", {})
    return {}

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
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(1.5 * (attempt + 1))

def tenant_token():
    r = urllib.request.Request(BASE + "/auth/v3/tenant_access_token/internal",
        data=json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode(),
        headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(r, timeout=30).read().decode())["tenant_access_token"]

# ---------- 列名容忍映射 ----------
ALIASES = {
    "name": ["name", "title", "名称"],
    "address": ["address", "full_address", "street_address", "complete_address", "地址"],
    "phone": ["phone", "phone_number", "电话"],
    "website": ["site", "website", "website_link", "网站"],
    "rating": ["review_rating", "rating", "google_rating", "评分"],
    "reviews": ["review_count", "reviews", "评论数"],
    "place_id": ["google_id", "place_id", "gmap_id", "id"],
    "latitude": ["latitude", "lat", "纬度"],
    "longitude": ["longitude", "lng", "lon", "经度"],
    "city": ["city", "center", "locality", "城市"],
    "country_code": ["country_code", "country", "cc"],
    "category": ["category", "categories", "types"],
    "business_status": ["business_status"],
}

# gosom CSV 没有 city/country 列 —— 用查询矩阵的城市名匹配 address 反推。
CN_EN = {"United Kingdom":"英国","Germany":"德国","France":"法国","Spain":"西班牙","Italy":"意大利",
"Poland":"波兰","Netherlands":"荷兰","Belgium":"比利时","Portugal":"葡萄牙","Czechia":"捷克",
"Austria":"奥地利","Switzerland":"瑞士","Sweden":"瑞典","Denmark":"丹麦","Finland":"芬兰",
"Norway":"挪威","Ireland":"爱尔兰","Greece":"希腊","Hungary":"匈牙利","Romania":"罗马尼亚",
"Bulgaria":"保加利亚","Croatia":"克罗地亚","Slovakia":"斯洛伐克","Slovenia":"斯洛文尼亚",
"Estonia":"爱沙尼亚","Latvia":"拉脱维亚","Lithuania":"立陶宛","Serbia":"塞尔维亚",
"Ukraine":"乌克兰","Malta":"马耳他","Cyprus":"塞浦路斯","Luxembourg":"卢森堡",
"United Arab Emirates":"阿联酋","UAE":"阿联酋","Saudi Arabia":"沙特",
"Qatar":"卡塔尔","Kuwait":"科威特","Bahrain":"巴林","Oman":"阿曼",
"Jordan":"约旦","Morocco":"摩洛哥"}

# GCC/MENA 城市反推表（derive 兜底：queries.json 里没有的中东城市）
GCC_CITY_COUNTRY = {c.lower(): (c, cn) for cn, cities in (
    ("阿联酋", ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain', 'Umm Al Quwain']),
    ("沙特", ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Dhahran', 'Mecca', 'Medina', 'Tabuk', 'Abha', 'Hail']),
    ("卡塔尔", ['Doha', 'Al Rayyan', 'Al Wakrah', 'Lusail']),
    ("科威特", ['Kuwait City', 'Salmiya', 'Hawally', 'Farwaniya', 'Al Ahmadi']),
    ("巴林", ['Manama', 'Riffa', 'Muharraq']),
    ("阿曼", ['Muscat', 'Salalah', 'Sohar', 'Nizwa']),
    ("约旦", ['Amman', 'Zarqa', 'Irbid', 'Aqaba']),
    ("摩洛哥", ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Fes', 'Agadir'])
) for c in cities}

def build_city_lookup(cfg):
    """city 英文名（小写）→ (city 原名, 国家中文)。含英文国名 → 国家中文。"""
    lookup = {}
    for label, info in cfg.get("countries", {}).items():
        for city in info.get("cities", []):
            lookup[city.lower()] = (city, label)
    return lookup

def derive_city_country(address, cn_map, lookup):
    """从 address 反推 (city, 国家中文)。先匹配矩阵城市名，再匹配英文国名。"""
    low = address.lower()
    for city_l, (city, label) in {**lookup, **GCC_CITY_COUNTRY}.items():
        if city_l in low:
            return city, label.split()[0] if label else ""
    for en, cn in CN_EN.items():
        if en.lower() in low:
            return "", cn
    return "", ""

def pick(row, key):
    for col in ALIASES[key]:
        if col in row and str(row[col]).strip() not in ("", "None", "nan"):
            return str(row[col]).strip()
    return ""

def load_rows(path: str):
    p = Path(path)
    if p.suffix.lower() == ".json":
        data = json.loads(p.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else data.get("results", data.get("data", []))
    with p.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def load_seen():
    if STATE.exists():
        try:
            return set(json.loads(STATE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()

def save_seen(seen):
    STATE.write_text(json.dumps(sorted(seen), ensure_ascii=False), encoding="utf-8")

def parse_complete_address(raw):
    """complete_address 部分行是 JSON 串（含 city + ISO2 国码），解析出结构化信息。"""
    if isinstance(raw, str) and raw.startswith("{"):
        try:
            obj = json.loads(raw)
            return str(obj.get("city", "")), str(obj.get("country", "")).upper()
        except Exception:
            pass
    return "", ""

def row_to_fields(row, cn_map, lookup):
    cc = pick(row, "country_code")[:2].upper()
    name = pick(row, "name")
    phone = pick(row, "phone")
    address = pick(row, "address")
    city = pick(row, "city")
    country = cn_map.get(cc, "") if cc else ""
    j_city, j_cc = parse_complete_address(row.get("complete_address", ""))
    if j_cc and not country:
        country = cn_map.get(j_cc, "")
    if j_city and not city:
        city = j_city
    if not city or not country:
        d_city, d_country = derive_city_country(address, cn_map, lookup)
        city = city or d_city
        country = country or d_country
    fields = {
        "名称": name,
        "国家": country or "其他",
        "城市": city,
        "地址": address,
        "外呼状态": "未触达",
        "来源": "Google Maps",
        "place_id": pick(row, "place_id"),
        "抓取时间": int(time.time() * 1000),
    }
    if phone:
        # 飞书电话字段：含字母/ext/多个号的会整批拒收 —— 剥尾巴只留主号，剥不干净就丢弃
        import re as _re
        clean = _re.split(r'(?:ext|分|，|；|,|/[a-zA-Z])', phone, flags=_re.I)[0].strip()
        if _re.match(r'^\+?[\d\s\-()]{5,20}$', clean):
            fields["电话"] = clean
    site = pick(row, "website")
    if site.startswith("http"):
        fields["网站"] = {"link": site, "text": site}
    for num_key, col in (("评分", "rating"), ("评论数", "reviews"), ("经度", "longitude"), ("纬度", "latitude")):
        raw = pick(row, col)
        try:
            v = float(raw)
            fields[num_key] = int(v) if col == "reviews" and v == int(v) else v
        except ValueError:
            pass
    return fields

def main():
    dry = "--dry-run" in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith("--")]
    cn_map = load_country_map()
    cfg = json.loads(Path(__file__).with_name("queries.json").read_text(encoding="utf-8"))
    lookup = build_city_lookup(cfg)
    rows = []
    for f in files:
        rows.extend(load_rows(f))
    print(f"读入 {len(rows)} 行")

    seen = load_seen()
    out, skipped_empty_name = [], 0
    for row in rows:
        fields = row_to_fields(row, cn_map, lookup)
        pid = fields.get("place_id", "")
        name = fields.get("名称", "")
        if not name:
            skipped_empty_name += 1
            continue
        key = pid or name
        if key in seen:
            continue
        seen.add(key)
        out.append({"fields": {k: v for k, v in fields.items() if v not in ("", None)}})

    print(f"去重后 {len(out)} 条（跳过空名 {skipped_empty_name}，重复 {len(rows) - len(out) - skipped_empty_name}）")
    by_country = {}
    for r in out:
        by_country[r["fields"].get("国家", "?")] = by_country.get(r["fields"].get("国家", "?"), 0) + 1
    for k in sorted(by_country, key=lambda x: by_country[x], reverse=True)[:12]:
        print(f"  {k}: {by_country[k]}")
    with_phone = sum(1 for r in out if "电话" in r["fields"])
    print(f"  含电话: {with_phone} ({with_phone * 100 // max(len(out), 1)}%)")

    if dry:
        return  # dry-run 不落状态，否则真上传会被误判为重复
    if not out:
        save_seen(seen)
        return

    T = tenant_token()
    ok = fail = 0
    for i in range(0, len(out), BATCH):
        chunk = out[i:i + BATCH]
        try:
            d = req("POST", f"/bitable/v1/apps/{APP}/tables/{TBL}/records/batch_create", T,
                    {"records": chunk})
            if d.get("code") == 0:
                ok += len(chunk)
            else:
                fail += len(chunk)
                print(f"batch {i//BATCH} error: {d.get('code')} {d.get('msg')}")
        except Exception as e:
            fail += len(chunk)
            print(f"batch {i//BATCH} exception: {e}")
        time.sleep(0.3)
    save_seen(seen)
    print(f"写入完成: ok={ok} fail={fail}")

if __name__ == "__main__":
    main()
