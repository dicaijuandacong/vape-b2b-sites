# Telegram 渠道设置卡（10 分钟）

> 目标：客户/门店在 Telegram 上找我们 → 运营飞书群立刻收到卡片提醒。
> 出站方向（运营主动用 TG 开发客户）已内置在询盘详情页，无需任何配置。

---

## 你要做的 3 步（只有你能做）

### Step 1 · 找 @BotFather 建机器人

1. Telegram 里搜 **@BotFather**（蓝V官方）
2. 发送 `/newbot`
3. 给机器人起名（显示名）：比如 `Vape Wholesale Sales`
4. 再给它一个用户名（必须以 `bot` 结尾）：比如 `vapewholesale_sales_bot`
5. BotFather 会回一条消息，里面有 **token**（形如 `1234567:AAxxxxxxx...`）→ **复制保存**

### Step 2 · 生成一个 webhook 密钥

随便编一串随机字符（别用中文），比如 32 位字母数字。
下面 Step 3 和环境变量里用的是同一个值。

### Step 3 · 绑定 webhook（把 BotFather 给的 token 和你的密钥填进去）

浏览器打开（一整行，替换 `<TOKEN>` 和 `<SECRET>`）：

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR-OPS-BOARD.vercel.app/api/telegram/webhook&secret_token=<SECRET>
```

看到 `{"ok":true,"result":true,...}` 就成功了。

---

## 需要改代码/配置的步骤

在 你的 Vercel 项目（ops-board）配两个环境变量（Production）：

| 变量 | 值 | 作用 |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Step 1 的 token | 自动回复客户「稍后联系」 |
| `TELEGRAM_WEBHOOK_SECRET` | Step 2 的密钥 | 校验进线消息是真的 Telegram 发来的（安全开关，没配=收不到） |

> ⚠️ token 只填进 env（Vercel / .env.local），不要提交进代码仓库、不要发到任何聊天里。

---

## 验收

1. 用你自己的 Telegram 给新机器人发一句 "test"
2. 运营飞书群应该立刻出现「📱 Telegram 进线」卡片（含你的用户名、消息内容）
3. 机器人也会自动回你一句 "Thanks for reaching out..."

## 然后怎么用

- **网站/名片上**放机器人链接 `https://t.me/<你的机器人用户名>`，客户点了就能聊
- **运营主动开发**：询盘详情页 →「Telegram 开发」→ 填客户的 @用户名（Google Maps 店铺页或社媒资料里有）→ 打开会话 + 自动记跟进
