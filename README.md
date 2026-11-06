# vape-b2b-sites

三套可直接部署的电子烟 B2B 批发获客站模板（Next.js 16 + Tailwind v4 + shadcn/ui），同一引擎、三套皮肤：

| 目录 | 皮肤 | 语言 | 特色 |
|---|---|---|---|
| `apps/vape-dubai` | 霓虹夜·编辑式（深紫+青） | EN + 阿拉伯语 RTL | 迪拜天际线 SVG、NeonRail/NeonSweep 动效 |
| `apps/vape-gulf` | 奢侈品画廊（墨绿+金） | EN + 阿拉伯语 RTL | 章节号排版、金色发丝线、MaisonList |
| `apps/vape-europe` | 工程规格·Bento（浅色+蓝） | 12 欧洲语言 | 按国合规矩阵（UK/FR/NL/BE）、SpecTable |
| `apps/ops-board` | 中文运营后台 | 中文 | 飞书扫码登录、询盘/潜客/跟进看板、RBAC |
| `tools/crawler` | Maps 爬虫流水线 | — | gosom Docker 爬虫 + 邮箱社媒 enrich + 飞书写入 |

## 功能

- 询盘表单（`/api/wholesale-inquiry`）+ 订阅（`/api/newsletter`），env 驱动：配 `RESEND_API_KEY` 走邮件转发，可选接飞书 Bitable
- 全站价格默认「Pricing on request」询盘制（`QuoteLabel` 组件）
- i18n 字典在 `src/lib/i18n/`；市场配置（电话/WhatsApp/汇率/域名）全部集中在每站 `src/lib/site.ts`
- 法律页草案（`/legal/*`，按 UAE/KSA/EU 框架对齐）——**上线前必须由执业律师复核签字**
- Cookie 同意横幅、sitemap/robots、JSON-LD 结构化数据

## 快速开始

```bash
cd apps/vape-europe
npm install
cp .env.example .env.local   # 按需填 RESEND_API_KEY 等（不填表单只写本地 JSONL）
npm run dev
```

## 部署（Vercel）

Import 本仓库 → **Root Directory 选 `apps/vape-europe`**（或另外两站）→ 配 env → Deploy。绑定自定义域名后把 `src/lib/site.ts` 里的占位电话/WhatsApp/邮箱换成你自己的。

## 数据说明（重要）

`data/products.json` 是**脱敏样例**：供应商价格、MOQ、库存、供货来源字段已全部移除，图片路径指向占位。正式使用请替换为你自己的产品目录（结构见 `_meta` 注释），产品图放 `public/` 下。

## 运营后台（apps/ops-board）

中文界面的获客运营看板：飞书 OAuth 扫码登录、管理员白名单（RBAC）、询盘流、潜客外呼页、跟进记录，数据全部存你自己的飞书 Bitable。搭建步骤见 `apps/ops-board/docs/` 下三张 setup 卡（飞书应用/飞书卡片回调/Telegram）。⚠️ `SKIP_AUTH` 保持关闭。

## 爬虫（tools/crawler）

`gen_queries.py` 生成查询组合 → Docker 跑 gosom 爬 Google Maps → `upload_to_feishu.py` 写入 Bitable。凭据全部走环境变量。用法见 `tools/crawler/README.md`。**注意：仅限对你有合法利益的数据使用；批量联系他人前自查当地法规（GDPR/CAN-SPAM 等）。**

## License

代码 MIT（见 LICENSE）。法律页文案为草案不构成法律意见；各品牌名称与商标归各自所有者。
