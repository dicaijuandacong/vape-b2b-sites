# maps-leads — Google Maps 爬虫流水线

Google Maps 门店抓取流水线（gosom Docker 爬虫 + 邮箱/社媒 enrich + 飞书 Bitable 写入），配套多语言 B2B 站点模板使用。

## 组件

| 文件 | 作用 |
|---|---|
| `gen_queries.py` + `queries.json` | 生成查询组合（欧洲 30 国城市 × 关键词） |
| `queries-*.txt` | **已生成好的 10,892 行查询**（email/gcc/mena/variants/remaining/one/test），可直接复用 |
| `upload_to_feishu.py` | CSV → 飞书 prospects 表（place_id 去重、分批 100、失败重试 2 次） |
| `update_emails.py` / `update_socials.py` / `add_social_columns.py` / `enrich_priority_opener.py` | 数据清洗与回填 |

## 环境变量（脚本已改为 env 读取，不再硬编码）

```bash
export FEISHU_APP_ID="cli_xxx"            # 你的飞书自建应用
export FEISHU_APP_SECRET="xxx"
export FEISHU_BITABLE_APP_TOKEN="basexxx" # 你的 Bitable
export FEISHU_TABLE_ID="tblxxx"           # prospects 表
```

## 跑爬虫（gosom Docker 版）

**`gmaps-scraper.exe`（Windows 版）跑不起来，是废的——只有 Docker 版有效。**

需要 Docker Desktop + 一个 HTTP 代理（爬 Google Maps 国内直连不稳）。容器通过宿主机代理出网：

```bash
# 代理格式是 用户名:密码@host:port；本地无认证代理就用 dummy 占位
docker run --rm \
  -v "$(pwd)/out:/app/out" \
  -e PROXY="dummy:dummy@host.docker.internal:<你的HTTP代理端口>" \
  gosom/google-maps-scraper \
  --query "vape shop in Berlin, Germany" --results 200 \
  --lang en --email --social-urls --config-file /app/out/config.yaml
```

参数名以镜像 `--help` 为准。批量跑就把 queries 文件喂给它（查 `--input-file` 用法）。邮箱/社媒 enrich 阶段最慢（每店 10-40s），日志里 `playwright: timeout` 属正常损耗，代理稳定能降失败率。

## 上传到飞书

```bash
python upload_to_feishu.py out/vape-europe-full.csv --dry-run  # 先看统计
python upload_to_feishu.py out/vape-europe-full.csv            # 真写入
```

## 说明

本仓库只含流水线代码与查询组合（10,892 行 'vape shop in {city}, {country}'）。抓取结果数据不随仓库分发，跑完落在本地 `out/`。
