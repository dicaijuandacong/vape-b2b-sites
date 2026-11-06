import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getTenantAccessToken, readFeishuConfig } from '@/lib/feishu-base';
import { cachedQuery, invalidateCache } from '@/lib/cache';
import { SITE_KEYS } from '@/features/kanban/api/types';
import {
  isOrderCurrency,
  isOrderStatus,
  type CreateOrderInput,
  type Order,
  type OrderCurrency,
  type OrderItem,
  type OrdersResponse,
  type OrderSite,
  type OrderStats,
  type OrderStatus
} from '@/features/orders/api/types';

/**
 * 订单数据访问层（仅服务端）。
 *
 * ============================================================
 * 飞书 Bitable `orders` 表结构（需在飞书侧手动创建，字段名必须完全一致）
 * ============================================================
 *
 * | 字段名   | 类型     | 说明                                                |
 * |---------|---------|-----------------------------------------------------|
 * | 客户     | 文本     | 公司名或邮箱                                          |
 * | 关联询盘 | 文本     | leads 表 record_id（从询盘转化时填入，可选）              |
 * | 来源站   | 单选     | dubai / gulf / europe / vapegogogo                   |
 * | 国家     | 文本     |                                                     |
 * | 商品明细 | 文本     | JSON 数组 [{"model":"ELF BAR BC5000","qty":500,"unitPrice":3.2,"productId":"elbar-bc5000"}] |
 * | 总件数   | 数字     | sum(qty)                                            |
 * | 总金额   | 数字     | sum(qty * unitPrice)，以「币种」计                      |
 * | 币种     | 单选     | EUR / CNY / USD                                     |
 * | 成本     | 数字     | 人民币成本（可选）                                      |
 * | 利润     | 数字     | 人民币利润（可选；留空 = 总金额折 CNY - 成本）             |
 * | 状态     | 单选     | 意向 / 已付款 / 已发货 / 已完成 / 已取消                 |
 * | 创建时间 | 创建时间 | 自动字段                                              |
 * | 付款时间 | 日期     | 可选                                                 |
 *
 * 配置方式：在存放 leads 表的同一个多维表格 App 里新建上表，把 table_id
 * 填进环境变量 FEISHU_ORDERS_TABLE_ID（与 leads 表共用
 * FEISHU_APP_ID / FEISHU_APP_SECRET / FEISHU_BITABLE_APP_TOKEN）。
 *
 * 未配置 FEISHU_ORDERS_TABLE_ID 或请求失败时回退 mock 模式：内置样例订单 +
 * 本地 JSON 文件（data/orders.local.json）持久化新建/改状态，保证演示可用。
 *
 * ============================================================
 * GMV / 利润口径（KPI 卡片，见 computeOrderStats）
 * ============================================================
 * - 已取消订单不计入任何指标。
 * - GMV：各单「总金额」按下方固定汇率折算成 EUR 求和，前端以 € 展示。
 * - 利润：优先取「利润」字段；缺省时按 总金额折 CNY - 成本 计算；
 *   两者都没有的订单不计入利润（避免把未知当 0）。前端以 ¥ 展示。
 * - 固定汇率仅用于看板汇总，真实对账以银行结算为准；汇率变化时改下方常量。
 */

/** 固定折算汇率：1 单位外币 = X EUR */
const FX_TO_EUR: Record<OrderCurrency, number> = { EUR: 1, USD: 0.92, CNY: 0.128 };
/** 固定折算汇率：1 单位外币 = X CNY */
const FX_TO_CNY: Record<OrderCurrency, number> = { EUR: 7.8, USD: 7.17, CNY: 1 };

function hasOrdersEnv(): boolean {
  return Boolean(
    process.env.FEISHU_APP_ID &&
    process.env.FEISHU_APP_SECRET &&
    process.env.FEISHU_BITABLE_APP_TOKEN &&
    process.env.FEISHU_ORDERS_TABLE_ID
  );
}

function ordersTableId(): string {
  const tableId = process.env.FEISHU_ORDERS_TABLE_ID;
  if (!tableId) throw new Error('feishu env missing: FEISHU_ORDERS_TABLE_ID');
  return tableId;
}

const BITABLE_RECORDS_URL = (appToken: string, tableId: string) =>
  `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`;

// ---------- Bitable 字段值解析（与 lib/leads.ts 同款容错） ----------

/** Bitable 文本字段读出来可能是 string / [{type:'text',text:'...'}] / {text,link} / number。 */
function asText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).join('');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.link === 'string') return record.link;
  }
  return '';
}

function asOptionalText(value: unknown): string | undefined {
  const text = asText(value).trim();
  return text ? text : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = asText(value).trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** 「创建时间」自动字段返回毫秒时间戳；兼容 ISO 字符串。 */
function asIsoDate(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (text) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function asOptionalIsoDate(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  const text = asText(value).trim();
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function asSite(value: unknown): OrderSite {
  const text = asText(value).trim().toLowerCase();
  return (SITE_KEYS as readonly string[]).includes(text) ? (text as OrderSite) : 'europe';
}

function asStatus(value: unknown): OrderStatus {
  const text = asText(value).trim();
  return isOrderStatus(text) ? text : '意向';
}

function asCurrency(value: unknown): OrderCurrency {
  const text = asText(value).trim().toUpperCase();
  return isOrderCurrency(text) ? text : 'EUR';
}

/** 「商品明细」是手填的 JSON 文本；解析失败时降级为单行备注型号，保证订单可见。 */
function asItems(value: unknown): OrderItem[] {
  const text = asText(value).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: OrderItem[] = [];
    for (const raw of parsed) {
      if (typeof raw !== 'object' || raw === null) continue;
      const record = raw as Record<string, unknown>;
      const model = asText(record.model).trim();
      const qty = Number(record.qty);
      const unitPrice = Number(record.unitPrice);
      if (
        !model ||
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        continue;
      }
      const productId = asOptionalText(record.productId);
      items.push({ model, qty, unitPrice, ...(productId ? { productId } : {}) });
    }
    return items;
  } catch {
    return [{ model: text, qty: 1, unitPrice: 0 }];
  }
}

interface BitableRecord {
  record_id?: string;
  fields?: Record<string, unknown>;
}

/** 映射一条 Bitable record → Order；客户为空的行返回 null（跳过）。 */
function mapRecord(record: BitableRecord): Order | null {
  const fields = record.fields ?? {};
  const customer = asText(fields['客户']).trim();
  if (!customer || !record.record_id) return null;

  const items = asItems(fields['商品明细']);
  const totalQty = asOptionalNumber(fields['总件数']) ?? sumQty(items);
  const totalAmount = asOptionalNumber(fields['总金额']) ?? sumAmount(items);

  return {
    id: record.record_id,
    leadId: asOptionalText(fields['关联询盘']),
    site: asSite(fields['来源站']),
    customer,
    country: asOptionalText(fields['国家']),
    items,
    totalQty,
    totalAmount,
    currency: asCurrency(fields['币种']),
    cost: asOptionalNumber(fields['成本']),
    profit: asOptionalNumber(fields['利润']),
    status: asStatus(fields['状态']),
    createdAt: asIsoDate(fields['创建时间']),
    paidAt: asOptionalIsoDate(fields['付款时间'])
  };
}

// ---------- 汇总计算 ----------

function sumQty(items: OrderItem[]): number {
  return items.reduce((acc, item) => acc + item.qty, 0);
}

function sumAmount(items: OrderItem[]): number {
  return items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
}

/** 单订单人民币利润：优先显式「利润」，否则 总金额折 CNY - 成本；都没有则 undefined。 */
export function orderProfitCny(order: Order): number | undefined {
  if (typeof order.profit === 'number') return order.profit;
  if (typeof order.cost === 'number') {
    return order.totalAmount * FX_TO_CNY[order.currency] - order.cost;
  }
  return undefined;
}

/** KPI 汇总：已取消订单不计入；GMV 折 EUR，利润折 CNY。 */
export function computeOrderStats(orders: Order[]): OrderStats {
  const active = orders.filter((order) => order.status !== '已取消');
  let gmvEur = 0;
  let profitCny = 0;
  let hasProfitData = false;
  for (const order of active) {
    gmvEur += order.totalAmount * FX_TO_EUR[order.currency];
    const profit = orderProfitCny(order);
    if (typeof profit === 'number') {
      profitCny += profit;
      hasProfitData = true;
    }
  }
  return {
    orderCount: active.length,
    totalQty: active.reduce((acc, order) => acc + order.totalQty, 0),
    gmvEur,
    profitCny,
    hasProfitData
  };
}

// ---------- 飞书读取 / 写入 ----------

interface BitableListResponse {
  code: number;
  msg?: string;
  data?: {
    items?: BitableRecord[];
    has_more?: boolean;
    page_token?: string;
  };
}

async function fetchAllOrderRecords(): Promise<Order[]> {
  const cfg = readFeishuConfig();
  const tableId = ordersTableId();
  const token = await getTenantAccessToken();

  const orders: Order[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(BITABLE_RECORDS_URL(cfg.bitableAppToken, tableId));
    url.searchParams.set('page_size', '500');
    if (pageToken) url.searchParams.set('page_token', pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`feishu list orders HTTP ${res.status}`);

    const data = (await res.json()) as BitableListResponse;
    if (data.code !== 0) {
      throw new Error(`feishu list orders failed: ${data.msg ?? data.code}`);
    }

    for (const record of data.data?.items ?? []) {
      const order = mapRecord(record);
      if (order) orders.push(order);
    }

    pageToken = data.data?.has_more ? data.data?.page_token : undefined;
  } while (pageToken);

  return orders;
}

/** 把一条新订单映射为 Bitable 字段（中文字段名，见文件头表结构注释）。 */
function mapOrderToFields(input: CreateOrderInput, order: Order): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    客户: order.customer,
    来源站: order.site,
    商品明细: JSON.stringify(order.items),
    总件数: order.totalQty,
    总金额: order.totalAmount,
    币种: order.currency,
    状态: order.status
  };
  if (input.leadId) fields['关联询盘'] = input.leadId;
  if (order.country) fields['国家'] = order.country;
  if (typeof order.cost === 'number') fields['成本'] = order.cost;
  if (typeof order.profit === 'number') fields['利润'] = order.profit;
  if (order.paidAt) fields['付款时间'] = new Date(order.paidAt).getTime();
  return fields;
}

/** 由表单入参构造完整 Order（算总件数/总金额/利润）。 */
function buildOrder(id: string, input: CreateOrderInput): Order {
  const totalQty = sumQty(input.items);
  const totalAmount = sumAmount(input.items);
  const base: Order = {
    id,
    site: input.site,
    customer: input.customer,
    items: input.items,
    totalQty,
    totalAmount,
    currency: input.currency,
    status: input.status,
    createdAt: new Date().toISOString()
  };
  if (input.leadId) base.leadId = input.leadId;
  if (input.country) base.country = input.country;
  if (typeof input.cost === 'number') base.cost = input.cost;
  if (input.paidAt) base.paidAt = input.paidAt;
  const profit = orderProfitCny(base);
  if (typeof profit === 'number') base.profit = profit;
  return base;
}

// ---------- mock 模式：内置样例 + 本地 JSON 文件持久化 ----------

const LOCAL_ORDERS_PATH = path.resolve(process.cwd(), 'data', 'orders.local.json');

interface LocalOrdersFile {
  /** mock 模式下新建的订单 */
  created: Order[];
  /** mock 模式下的状态覆盖（含内置样例订单的改状态） */
  statusOverrides: Record<string, OrderStatus>;
}

async function readLocalOrders(): Promise<LocalOrdersFile> {
  try {
    const raw = await fs.readFile(LOCAL_ORDERS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalOrdersFile>;
    return {
      created: Array.isArray(parsed.created) ? parsed.created : [],
      statusOverrides:
        typeof parsed.statusOverrides === 'object' && parsed.statusOverrides !== null
          ? parsed.statusOverrides
          : {}
    };
  } catch {
    return { created: [], statusOverrides: {} };
  }
}

async function writeLocalOrders(data: LocalOrdersFile): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_ORDERS_PATH), { recursive: true });
  await fs.writeFile(LOCAL_ORDERS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function getMockOrders(): Promise<Order[]> {
  const local = await readLocalOrders();
  const seeds = MOCK_ORDERS.map((order) => ({
    ...order,
    status: local.statusOverrides[order.id] ?? order.status
  }));
  const created = local.created.map((order) => ({
    ...order,
    status: local.statusOverrides[order.id] ?? order.status
  }));
  return [...created, ...seeds].toSorted(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ---------- 对外 API ----------

/** 读取全部订单（新→旧）；飞书不可用（未配置 / 请求失败）时回退 mock。30 分钟缓存。 */
export async function getOrders(): Promise<OrdersResponse> {
  if (!hasOrdersEnv()) {
    return { orders: await getMockOrders(), source: 'mock' };
  }
  try {
    const orders = await cachedQuery('orders_all', fetchAllOrderRecords);
    const sorted = orders.toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { orders: sorted, source: 'feishu' };
  } catch (error) {
    console.error('[orders] feishu fetch failed, falling back to mock:', error);
    return { orders: await getMockOrders(), source: 'mock' };
  }
}

/** 新建订单；返回新订单 id。mock 模式写入本地 JSON 文件持久化。 */
export async function createOrder(
  input: CreateOrderInput
): Promise<{ ok: true; id: string; source: 'feishu' | 'mock' }> {
  if (!hasOrdersEnv()) {
    const id = `local_${Date.now().toString(36)}`;
    const order = buildOrder(id, input);
    const local = await readLocalOrders();
    local.created.unshift(order);
    await writeLocalOrders(local);
    return { ok: true, id, source: 'mock' };
  }

  const cfg = readFeishuConfig();
  const tableId = ordersTableId();
  const token = await getTenantAccessToken();
  const order = buildOrder('', input);

  const res = await fetch(BITABLE_RECORDS_URL(cfg.bitableAppToken, tableId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ fields: mapOrderToFields(input, order) })
  });
  if (!res.ok) throw new Error(`feishu create order HTTP ${res.status}`);
  const data = (await res.json()) as {
    code: number;
    msg?: string;
    data?: { record?: { record_id?: string } };
  };
  if (data.code !== 0) throw new Error(`feishu create order failed: ${data.msg ?? data.code}`);
  void invalidateCache('orders_all');
  return { ok: true, id: data.data?.record?.record_id ?? '', source: 'feishu' };
}

/** 更新单条订单的「状态」字段；状态变为「已付款」且未记录付款时间时一并写入。 */
export async function updateOrderStatus(
  recordId: string,
  status: OrderStatus
): Promise<{ ok: true; source: 'feishu' | 'mock' }> {
  if (!hasOrdersEnv()) {
    const local = await readLocalOrders();
    local.statusOverrides[recordId] = status;
    await writeLocalOrders(local);
    return { ok: true, source: 'mock' };
  }

  const cfg = readFeishuConfig();
  const tableId = ordersTableId();
  const token = await getTenantAccessToken();

  const res = await fetch(`${BITABLE_RECORDS_URL(cfg.bitableAppToken, tableId)}/${recordId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ fields: { 状态: status } })
  });
  if (!res.ok) throw new Error(`feishu update order status HTTP ${res.status}`);
  const data = (await res.json()) as { code: number; msg?: string };
  if (data.code !== 0) {
    throw new Error(`feishu update order status failed: ${data.msg ?? data.code}`);
  }
  return { ok: true, source: 'feishu' };
}

// ---------- 内置 mock 数据 ----------

const MOCK_ORDERS: Order[] = [
  {
    id: 'recOrderMock001',
    leadId: 'recMock006',
    site: 'europe',
    customer: 'Dampf Palast GmbH',
    country: 'Germany',
    items: [
      { productId: 'vaporesso-xros-3', model: 'VAPORESSO XROS 3', qty: 2000, unitPrice: 6.5 },
      { model: 'VUSE GO 700', qty: 1000, unitPrice: 4.2 }
    ],
    totalQty: 3000,
    totalAmount: 17200,
    currency: 'EUR',
    cost: 98000,
    profit: 36160,
    status: '已完成',
    createdAt: '2026-07-30T09:12:00.000Z',
    paidAt: '2026-08-02T13:40:00.000Z'
  },
  {
    id: 'recOrderMock002',
    leadId: 'recMock004',
    site: 'dubai',
    customer: 'Cloud Nine Smoke Shop',
    country: 'UAE',
    items: [
      { model: 'GEEK BAR PULSE 15000', qty: 5000, unitPrice: 5.8 },
      { model: 'RAZ TN9000', qty: 3000, unitPrice: 5.1 }
    ],
    totalQty: 8000,
    totalAmount: 44300,
    currency: 'USD',
    cost: 236000,
    status: '已发货',
    createdAt: '2026-08-11T15:26:00.000Z',
    paidAt: '2026-08-12T08:05:00.000Z'
  },
  {
    id: 'recOrderMock003',
    leadId: 'recMock005',
    site: 'gulf',
    customer: 'Doha Cloud Trading',
    country: 'Qatar',
    items: [{ model: 'ELF BAR BC5000 样品（10 口味混装）', qty: 100, unitPrice: 3.6 }],
    totalQty: 100,
    totalAmount: 360,
    currency: 'USD',
    cost: 1900,
    status: '已付款',
    createdAt: '2026-08-13T11:48:00.000Z',
    paidAt: '2026-08-14T06:30:00.000Z'
  },
  {
    id: 'recOrderMock004',
    site: 'vapegogogo',
    customer: 'ECig City SARL',
    country: 'France',
    items: [
      { model: 'BANG KING 30000', qty: 2000, unitPrice: 4.9 },
      { model: 'FUMOT TORNADO 20000', qty: 2000, unitPrice: 4.5 }
    ],
    totalQty: 4000,
    totalAmount: 18800,
    currency: 'EUR',
    status: '意向',
    createdAt: '2026-08-17T10:40:00.000Z'
  },
  {
    id: 'recOrderMock005',
    site: 'europe',
    customer: 'Vapegrossisten AB',
    country: 'Sweden',
    items: [{ model: 'GEEK BAR WATT 23000', qty: 1500, unitPrice: 6.1 }],
    totalQty: 1500,
    totalAmount: 9150,
    currency: 'EUR',
    cost: 52000,
    status: '已取消',
    createdAt: '2026-08-06T14:02:00.000Z'
  }
];
