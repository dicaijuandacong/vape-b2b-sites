import { apiClient } from '@/lib/api-client';
import type { LeadsResponse, LeadStatus } from './types';
import type { AddFollowupResult, FollowChannel, Followup } from '@/lib/followups';

/**
 * 看板客户端数据访问 —— 走 /api/leads 路由（BFF 模式）。
 * 服务端直接读库请用 '@/lib/leads' 的 getLeads()。
 */

export function fetchLeads(): Promise<LeadsResponse> {
  return apiClient<LeadsResponse>('/leads');
}

export async function updateLeadStatus(recordId: string, status: LeadStatus): Promise<void> {
  await apiClient(`/leads/${encodeURIComponent(recordId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export interface AddFollowupPayload {
  channel: FollowChannel;
  content: string;
  nextAction?: string;
  nextFollowAt?: string;
}

/** 记一笔 / 一键触达自动记录 → POST /api/leads/[id]/followups。 */
export function addFollowup(
  recordId: string,
  payload: AddFollowupPayload
): Promise<AddFollowupResult> {
  return apiClient<AddFollowupResult>(`/leads/${encodeURIComponent(recordId)}/followups`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export type { Followup };
