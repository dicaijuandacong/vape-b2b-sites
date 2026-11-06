import os
import json, urllib.request
APP_ID= os.environ["FEISHU_APP_ID"]; APP_SECRET= os.environ["FEISHU_APP_SECRET"]
BASE="https://open.feishu.cn/open-apis"
r=urllib.request.Request(BASE+"/auth/v3/tenant_access_token/internal",
    data=json.dumps({"app_id":APP_ID,"app_secret":APP_SECRET}).encode(),
    headers={"Content-Type":"application/json"},method="POST")
T=json.loads(urllib.request.urlopen(r,timeout=30).read().decode())["tenant_access_token"]
# 尝试 drive metas 重命名
for endpoint, body in [
    (f"/drive/v1/metas/{os.environ['FEISHU_BITABLE_APP_TOKEN']}", {"title":"雾化获客·leads","type":"objecf"}),
    (f"/drive/explorer/v2/file/{os.environ['FEISHU_BITABLE_APP_TOKEN']}/rename", {"title":"雾化获客·leads"}),
]:
    try:
        req=urllib.request.Request(BASE+endpoint,
            data=json.dumps(body).encode(),method="POST",
            headers={"Authorization":f"Bearer {T}","Content-Type":"application/json; charset=utf-8"})
        with urllib.request.urlopen(req,timeout=20) as resp:
            print(endpoint, "->", resp.read().decode()[:200])
    except Exception as e:
        print(endpoint, "FAIL:", str(e)[:150])
