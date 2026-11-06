export const CATEGORY_OPTIONS = [
  { value: 'disposable', label: '一次性' },
  { value: 'rechargeable-disposable', label: '可充电一次性' },
  { value: 'open-system', label: '开放式' },
  { value: 'shisha-style', label: '水烟式' },
  { value: 'shisha', label: '水烟' }
];

export const STATUS_OPTIONS = [
  { value: 'active', label: '上架中' },
  { value: 'inactive', label: '已下架' }
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

/** Display label for a category slug; falls back to the raw slug. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
