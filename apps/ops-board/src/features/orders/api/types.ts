import type { SiteKey } from '@/lib/feishu-base';

/**
 * 订单状态 —— 同时作为飞书 Bitable「状态」单选字段值。
 * 顺序即漏斗/下拉展示顺序。
 */
export const ORDER_STATUSES = ['意向', '已付款', '已发货', '已完成', '已取消'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_CURRENCIES = ['EUR', 'CNY', 'USD'] as const;

export type OrderCurrency = (typeof ORDER_CURRENCIES)[number];

export type OrderSite = SiteKey;

/** 订单里的一行商品。productId 关联 catalog SKU（可选，手动录入时只填型号）。 */
export interface OrderItem {
  productId?: string;
  /** 型号，如 'ELF BAR BC5000' */
  model: string;
  qty: number;
  /** 单价（以订单币种计） */
  unitPrice: number;
}

/** 一条订单（飞书 Bitable orders 表的一行，已映射为英文字段）。 */
export interface Order {
  /** 飞书 record_id（mock 模式下为本地生成的 id） */
  id: string;
  /** 来源询盘的 record_id（从询盘转化而来时带上） */
  leadId?: string;
  site: OrderSite;
  /** 客户 = 公司名或邮箱 */
  customer: string;
  country?: string;
  items: OrderItem[];
  /** 总件数 = sum(items.qty) */
  totalQty: number;
  /** 总金额（以 currency 计） = sum(qty * unitPrice) */
  totalAmount: number;
  currency: OrderCurrency;
  /** 人民币成本（可选） */
  cost?: number;
  /** 人民币利润（可选；缺省时按 总金额折CNY - 成本 计算） */
  profit?: number;
  status: OrderStatus;
  /** ISO 时间字符串 */
  createdAt: string;
  paidAt?: string;
}

export interface OrdersResponse {
  orders: Order[];
  source: 'feishu' | 'mock';
}

/** 「新建订单」表单 / POST /api/orders 的入参（服务端负责算 totalQty/totalAmount/profit）。 */
export interface CreateOrderInput {
  leadId?: string;
  site: OrderSite;
  customer: string;
  country?: string;
  items: OrderItem[];
  currency: OrderCurrency;
  cost?: number;
  status: OrderStatus;
  paidAt?: string;
}

/** 订单 KPI 汇总（订单数/件数/GMV/利润，见 lib/orders.ts 的 computeOrderStats）。 */
export interface OrderStats {
  /** 有效订单数（不含已取消） */
  orderCount: number;
  /** 下单总件数（不含已取消） */
  totalQty: number;
  /** GMV，折算为欧元 */
  gmvEur: number;
  /** 利润，折算为人民币（仅有成本/利润数据的订单计入） */
  profitCny: number;
  /** 是否至少有一单有利润数据（决定利润卡片显示数字还是「—」） */
  hasProfitData: boolean;
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isOrderCurrency(value: unknown): value is OrderCurrency {
  return typeof value === 'string' && (ORDER_CURRENCIES as readonly string[]).includes(value);
}
