import os
import json, urllib.request
APP_ID= os.environ["FEISHU_APP_ID"]; APP_SECRET= os.environ["FEISHU_APP_SECRET"]
APP= os.environ["FEISHU_BITABLE_APP_TOKEN"]; TBL=os.environ["FEISHU_TABLE_ID"]
BASE="https://open.feishu.cn/open-apis"
def req(method,url,token,body=None):
    data=json.dumps(body).encode() if body is not None else None
    r=urllib.request.Request(BASE+url,data=data,method=method)
    r.add_header("Authorization",f"Bearer {token}")
    if data is not None: r.add_header("Content-Type","application/json; charset=utf-8")
    with urllib.request.urlopen(r,timeout=30) as resp: return json.loads(resp.read().decode())
r=urllib.request.Request(BASE+"/auth/v3/tenant_access_token/internal",
    data=json.dumps({"app_id":APP_ID,"app_secret":APP_SECRET}).encode(),
    headers={"Content-Type":"application/json"},method="POST")
T=json.loads(urllib.request.urlopen(r,timeout=30).read().decode())["tenant_access_token"]
existing = {f["field_name"] for f in req("GET",f"/bitable/v1/apps/{APP}/tables/{TBL}/fields?page_size=60",T)["data"]["items"]}
for name in ["Instagram","Facebook","TikTok","Telegram","X推特"]:
    if name in existing:
        print(name, "已存在"); continue
    d = req("POST", f"/bitable/v1/apps/{APP}/tables/{TBL}/fields", T, {"field_name": name, "type": 15})
    print(name, d.get("code"), d.get("msg"))
