'use client';

/**
 * 外呼清单行内状态下拉：选中即 PATCH /api/prospects/[id]，
 * 失败回显旧值（数据不丢，飞书为准）。
 */

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PROSPECT_STATUSES, type ProspectStatus } from '@/lib/prospects';

export function ProspectStatusSelect({
  prospectId,
  initialStatus
}: {
  prospectId: string;
  initialStatus: ProspectStatus;
}) {
  const [status, setStatus] = useState<ProspectStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function onChange(next: ProspectStatus) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setStatus(prev); // 写入失败回滚，避免界面与飞书不一致
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      value={status}
      onValueChange={(v) => void onChange(v as ProspectStatus)}
      disabled={saving}
    >
      <SelectTrigger size='sm' className='w-[130px] text-xs'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROSPECT_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className='text-xs'>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
