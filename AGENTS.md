# AGENTS.md — 接手指南（给 AI 编程助手/Codex/Claude Code）

> 你（AI agent）正在帮助一位新所有者接手这套电子烟 B2B 获客系统。本文件是完整施工图。逐节执行，遇到需要人类操作（注册账号/网页点击）时清楚告知用户该做什么，然后继续。

## 项目地图

```
apps/vape-dubai    迪拜站（EN+AR RTL，AED，霓虹夜皮肤）
apps/vape-gulf     沙特站（EN+AR RTL，SAR，奢侈品画廊皮肤）
apps/vape-europe   欧洲站（12 语言，EUR，工程 Bento 皮肤）
apps/ops-board     中文运营后台（飞书 OAuth + Bitable 数据，询盘/潜客/跟进/订单看板）
tools/crawler      Google Maps 爬虫流水线（gosom Docker + 飞书写入）
```

三站同构：Next.js 16 + Tailwind v4 + shadcn/ui，市场配置全在各自 `src/lib/site.ts`（品牌/电话/WhatsApp/汇率/域名/邮箱——目前是占位值，上线前必须替换）。产品数据在 `data/products.json`（**公开版是脱敏样例**：价格/MOQ/供货来源已清除，正式数据见下方「私有数据包」）。

## 施工顺序（建议给用户排的路线）

### 第 1 步 · 本地跑通（30 分钟）
```bash
cd apps/vape-europe && npm install && cp .env.example .env.local && npm run dev
```
三站任选其一先跑。`npm run check` = lint + typecheck + build，全绿再往下。

### 第 2 步 · 部署上线（每站约 15 分钟）
1. 仓库推到用户自己的 GitHub（公开仓是模板，别直接在原仓库上开发——fork 或重新 init 均可）
2. Vercel → New Project → Import → **Root Directory 选对应 app 目录**（monorepo 结构，别选仓库根）
3. env 按 `.env.example` 填：`RESEND_API_KEY`（必配，否则 Vercel 上表单丢单）→ `NEXT_PUBLIC_SITE_URL`；可选 `FEISHU_*` 四件套接运营后台
4. ⚠️ 已知坑：push 后 Vercel 不触发部署 → `vercel git disconnect` + `vercel git connect` 重连；`SKIP_AUTH` 必须保持关闭；法律页是**未经律师签字的草案**，商用前要当地律师复核
5. 站内联系方式：改 `src/lib/site.ts` 的 phoneDisplay/whatsapp/email
6. 域名：仓库 docs/ 有候选清单；Vercel → Settings → Domains 绑定后，Resend 验证发件域

### 第 3 步 · 运营后台（约 1 小时，含飞书手动步骤）
`apps/ops-board/docs/` 下三张 setup 卡（飞书应用 5 步 / 飞书卡片回调 / Telegram bot）——按卡走，每步需要用户在飞书开放平台网页上操作。env 全表见 `apps/ops-board/env.example.txt`；`AUTH_SECRET` 重新生成；`ADMIN_OPEN_IDS` 填用户自己的飞书 open_id（登录一次后从日志里拿）。

### 第 4 步 · 爬虫（需要时）
`tools/crawler/README.md`——Docker 版 gosom（`gmaps-scraper.exe` 是废的），代理通过 `PROXY` 环境变量传，凭据走 `FEISHU_*` 环境变量。查询组合已备好（queries-*.txt）。

## 私有数据包（用户会单独收到，不在本仓库）

如果用户拿到了 `vape-leads-private` 压缩包（与本仓库同级解压），结构：
- `maps-leads/out/` — 爬取成果 CSV/JSON（欧洲/GCC/MENA 门店：名称/地址/电话/邮箱/社媒）
- `data-backups/backups/` — 飞书 5 表每日 JSONL 备份（leads/prospects/orders/followups/ops_kv）
- 真实产品目录（含价格/MOQ）

⚠️ 这些含欧盟自然人联系信息（GDPR）：**只用于 B2B 业务联络，禁止公开传播、禁止转卖、禁止无差别群发**。导入方式：CSV 直接进飞书 Bitable（crawler 的 upload_to_feishu.py 可复用）或任何 CRM；真实产品目录替换各站 `data/products.json`（字段结构兼容，直接覆盖后跑 `npm run check`）。

## 代码风格与约定

- 改市场配置只动 `site.ts`，别散落到组件里
- i18n 文案在 `src/lib/i18n/`；AR 语言布局自动 RTL，别手写 direction
- 价格一律 `QuoteLabel`（询盘制），公开页不展示数字价格——这是刻意的商业策略，别"修复"它
- ops-board 是中文界面，面向中文运营人员
