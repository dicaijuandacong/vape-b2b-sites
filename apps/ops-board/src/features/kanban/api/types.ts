import type { SiteKey } from '@/lib/feishu-base';

/**
 * 询盘漏斗状态 —— 同时作为看板列 id 与飞书 Bitable「状态」字段值。
 * 顺序即漏斗展示顺序。
 */
export const LEAD_STATUSES = [
  '新询盘',
  '已联系',
  '已报价',
  '样品单',
  '成交',
  '流失',
  '待跟进'
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadSite = SiteKey;

export type LeadType = 'wholesale' | 'newsletter';

export const SITE_KEYS: readonly LeadSite[] = ['dubai', 'gulf', 'europe', 'vapegogogo'];

export const SITE_LABELS: Record<LeadSite, string> = {
  dubai: 'DubaiVape',
  gulf: 'GulfVape',
  europe: 'EuroVape',
  vapegogogo: 'VapeGoGoGo'
};

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  wholesale: 'B2B 询盘',
  newsletter: '邮件订阅'
};

/** 一条询盘（飞书 Bitable leads 表的一行，已映射为英文字段）。 */
export interface Lead {
  /** 飞书 record_id */
  id: string;
  site: LeadSite;
  type: LeadType;
  email: string;
  company?: string;
  country?: string;
  phone?: string;
  brands?: string[];
  volume?: string;
  notes?: string;
  status: LeadStatus;
  /** ISO 时间字符串 */
  createdAt: string;
  /** 最后一次跟进时间（ISO），来自 leads 表「最后跟进」字段 */
  lastFollowAt?: string;
}

export interface LeadsResponse {
  leads: Lead[];
  source: 'feishu' | 'mock';
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}
