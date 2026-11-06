import type { OrderCurrency } from '../api/types';

/** 金额按币种格式化（€ / ¥ / $），最多两位小数。 */
export function formatMoney(amount: number, currency: OrderCurrency): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);
}

/** 订单日期统一按上海时区展示（运营团队在国内）。 */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}
