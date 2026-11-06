'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FollowupCalendarSyncProps {
  leadId: string;
  /** 公司名或邮箱，用于日程标题。 */
  leadLabel: string;
  /** 当前「下次跟进日期」（ISO），无则 null。 */
  initialNextFollowAt: string | null;
  /** 已同步的飞书日程 event_id，无则 null。 */
  initialEventId: string | null;
}

interface SyncResponse {
  synced: boolean;
  eventId?: string;
  alreadySynced?: boolean;
  reason?: string;
}

/** ISO → <input type="datetime-local"> 需要的本地格式 YYYY-MM-DDTHH:mm。 */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}

/**
 * 询盘详情页「日历提醒」卡片：
 * 展示下次跟进日期 + 📅 同步状态，并支持手动「同步到飞书日历」。
 */
export function FollowupCalendarSync({
  leadId,
  leadLabel,
  initialNextFollowAt,
  initialEventId
}: FollowupCalendarSyncProps) {
  const router = useRouter();
  const [dueAt, setDueAt] = useState(
    initialNextFollowAt ? toLocalInputValue(initialNextFollowAt) : ''
  );
  const [eventId, setEventId] = useState(initialEventId);

  const { mutate, isPending } = useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      const res = await fetch(`/api/leads/${leadId}/followups/sync-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          leadLabel
        })
      });
      const data = (await res.json()) as SyncResponse;
      if (!res.ok) {
        throw new Error(data.reason ?? `HTTP ${res.status}`);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.synced) {
        setEventId(data.eventId ?? null);
        toast.success(data.alreadySynced ? '该跟进已同步过飞书日历' : '已同步到飞书日历');
        router.refresh();
      } else {
        toast.warning('未能同步日历', {
          description: data.reason ?? '请检查飞书日历权限配置'
        });
      }
    },
    onError: (error) => {
      toast.error('日历同步失败', {
        description: error instanceof Error ? error.message : undefined
      });
    }
  });

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-muted-foreground text-sm'>下次跟进</span>
        {eventId ? (
          <Badge variant='secondary' className='gap-1 rounded-sm'>
            <Icons.calendar className='h-3 w-3' /> 已同步飞书日历
          </Badge>
        ) : (
          <Badge variant='outline' className='rounded-sm'>
            未同步
          </Badge>
        )}
      </div>

      <Input
        type='datetime-local'
        value={dueAt}
        onChange={(event) => setDueAt(event.target.value)}
      />
      {initialNextFollowAt && (
        <p className='text-muted-foreground text-xs'>
          当前跟进时间：{formatDisplay(initialNextFollowAt)}
        </p>
      )}

      <Button
        type='button'
        variant={eventId ? 'outline' : 'default'}
        size='sm'
        disabled={isPending || !dueAt}
        onClick={() => mutate()}
      >
        <Icons.calendar className='mr-2 h-4 w-4' />
        {isPending ? '同步中…' : eventId ? '重新同步到飞书日历' : '同步到飞书日历'}
      </Button>
      <p className='text-muted-foreground text-xs'>
        同步后会在飞书日历创建一条 30 分钟的跟进日程。
      </p>
    </div>
  );
}
