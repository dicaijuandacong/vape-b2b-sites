import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { FOLLOW_CHANNEL_LABELS, type FollowChannel, type Followup } from '@/lib/followups';

/** 跟进时间统一按上海时区展示（运营团队在国内）。 */
function formatAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeZone: 'Asia/Shanghai'
  }).format(date);
}

const CHANNEL_BADGE_VARIANTS: Record<FollowChannel, 'default' | 'secondary' | 'outline'> = {
  whatsapp: 'default',
  email: 'secondary',
  telegram: 'default',
  call: 'outline',
  note: 'outline'
};

const CHANNEL_ICONS: Record<FollowChannel, typeof Icons.chat> = {
  whatsapp: Icons.chat,
  email: Icons.send,
  telegram: Icons.send,
  call: Icons.phone,
  note: Icons.page
};

interface FollowupTimelineProps {
  followups: Followup[];
}

/** 询盘详情页「跟进记录」时间线（服务端渲染，新 → 旧）。 */
export function FollowupTimeline({ followups }: FollowupTimelineProps) {
  if (followups.length === 0) {
    return (
      <p className='text-muted-foreground text-sm'>
        暂无跟进记录，用下方「记一笔」留下第一条，或点「一键触达」自动记录。
      </p>
    );
  }

  return (
    <ol className='relative flex flex-col gap-5 border-l pl-5'>
      {followups.map((item) => {
        const ChannelIcon = CHANNEL_ICONS[item.channel];
        return (
          <li key={item.id} className='relative'>
            <span className='bg-background absolute top-1 -left-[1.65rem] flex h-5 w-5 items-center justify-center rounded-full border'>
              <ChannelIcon className='text-muted-foreground h-3 w-3' />
            </span>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={CHANNEL_BADGE_VARIANTS[item.channel]} className='rounded-sm'>
                {FOLLOW_CHANNEL_LABELS[item.channel]}
              </Badge>
              <time className='text-muted-foreground text-xs'>{formatAt(item.at)}</time>
            </div>
            <p className='mt-1.5 text-sm break-words whitespace-pre-wrap'>{item.content}</p>
            {(item.nextAction || item.nextFollowAt) && (
              <p className='text-muted-foreground mt-1 text-xs'>
                {item.nextAction && <>下次动作：{item.nextAction}</>}
                {item.nextAction && item.nextFollowAt && ' · '}
                {item.nextFollowAt && <>下次跟进：{formatDay(item.nextFollowAt)}</>}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
