# 飞书 setup 操作卡（Task 1 · 10 分钟）

> 一次性手动步骤。AI 无法替你做（要你的飞书登录态 + 密钥）。做完把 5 个 env 填进 `.env.local` 和 Vercel 即可，**密钥只填进 .env.local / Vercel，不要发给任何人**。

---

## A. 建自建应用（3 min）

1. 开 `https://open.feishu.cn/app` → 登录你的飞书
2. **「创建企业自建应用」** → 名称 `电子烟获客运营`、描述随意、图标默认 → 创建
3. 左侧 **「凭证与基础信息」** → 复制 **App ID**(`cli_…`) 和 **App Secret**
4. 左侧 **「权限管理」** → 搜 `bitable` → 勾全部多维表格权限 → **「批量开通」**
5. 左侧 **「版本管理与发布」** → 创建版本 `1.0.0` → **申请发布**（自建租户你是管理员，秒过）

## B. 建多维表格（4 min）

1. 飞书云文档 → 新建 **「多维表格」** → 命名 `电子烟获客 · leads`
2. URL 形如 `…/base/BASExxxxxx?table=tblYYYY` → 记下 **APP_TOKEN**(`BASExxx`) 和 **TABLE_ID**(`tblYYYY`)
3. 默认表改名 `leads`，建下列字段（顺序无关）：

| 字段名 | 类型 | 说明 |
|---|---|---|
| 来源站 | 单选 | 选项 dubai / gulf / europe |
| 类型 | 单选 | 选项 wholesale / newsletter |
| 公司 | 文本 | |
| 国家 | 文本 | |
| 邮箱 | 文本 | |
| 电话 | 文本 | |
| WhatsApp | 超链接 | |
| 意向品牌 | 多选 | |
| 采购量级 | 文本 | |
| 备注 | 文本 | |
| 状态 | 单选 | 选项 新询盘/已联系/已报价/样品单/成交/流失/待跟进 |
| 负责人 | 人员 | 二阶段用，先留空 |
| 来源IP | 文本 | |
| UA | 文本 | |
| 创建时间 | 创建时间 | 选「自动填写」 |
| 最后跟进 | 日期 | 二阶段用 |

4. **再建第二张表 `followups`**（二阶段写入）：`关联询盘`(关联→leads) / `时间`(日期) / `通道`(单选 whatsapp,email,call,note) / `内容`(文本) / `下次动作`(文本)
5. 多维表格右上角 **「…」→「添加文档应用」** → 搜到刚建的应用 → 加为「可编辑」⚠️ **不加这步会 403**

## C. 建群机器人（1 min）

1. 建一个「运营询盘」群（或用现有运营群）
2. 群设置 → **「群机器人」→「添加机器人」→「自定义机器人」** → 命名 `询盘通知`
3. 复制 **webhook URL**(`https://open.feishu.cn/open-apis/bot/v2/hook/…`)

## D. 填凭证（2 min）

**本地** `sites/vape-*/.env.local`（三站各一份）+ `ops/.env.local`：
```
FEISHU_APP_ID=cli_…
FEISHU_APP_SECRET=…
FEISHU_BITABLE_APP_TOKEN=BASE…
FEISHU_LEADS_TABLE_ID=tbl…
FEISHU_BOT_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/…
```
**Vercel**：三站项目 → Settings → Environment Variables → 加同样 5 个（Production + Preview）→ Redeploy。

## E. 验证（AI 跑）

填好后运行 `npm run verify:ops`（端到端验收）验证。
