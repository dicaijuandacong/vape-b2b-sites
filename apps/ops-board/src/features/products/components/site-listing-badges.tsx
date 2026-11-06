import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { LISTING_SITES } from '@/lib/site-listing-shared';
import { cn } from '@/lib/utils';

interface SiteListingBadgesProps {
  /** 有效单站状态（dubai/gulf/europe → bool）；缺省视为全部跟随全局。 */
  listings?: Record<string, boolean>;
  className?: string;
}

/**
 * 紧凑的三站上下架指示：`[迪拜✓] [沙特✓] [欧洲✗]`。
 * 绿色 ✓ = 该站上架中；灰红 ✗ = 该站已下架。
 */
export function SiteListingBadges({ listings, className }: SiteListingBadgesProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {LISTING_SITES.map(({ key, label }) => {
        const listed = listings?.[key] ?? true;
        const Icon = listed ? Icons.circleCheck : Icons.xCircle;
        return (
          <Badge
            key={key}
            variant='outline'
            className={cn(
              'gap-0.5 px-1 py-0 text-[10px] font-normal',
              listed
                ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground border-destructive/40'
            )}
          >
            <Icon className='size-2.5' />
            {label}
            {listed ? '✓' : '✗'}
          </Badge>
        );
      })}
    </div>
  );
}
