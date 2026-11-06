'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LISTING_SITES, type ListingSite } from '@/lib/site-listing-shared';
import { setSiteListingMutation } from '../api/mutations';
import { productKeys } from '../api/queries';
import type { Product } from '../api/types';

interface SiteListingCardProps {
  product: Product;
}

/**
 * 「站点上下架」面板：三个站点（迪拜/沙特/欧洲）各自独立开关。
 * 站点覆盖叠加在全局 active 之上——未设置覆盖的站点继承全局状态；
 * 全局已下架时仍可按站单独上架（覆盖优先）。
 */
export function SiteListingCard({ product }: SiteListingCardProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    ...setSiteListingMutation,
    onSuccess: (data, variables) => {
      // 覆盖了 mutationOptions 里的 onSuccess —— 手动补上做缓存失效。
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      if (data.success) {
        const label = LISTING_SITES.find((s) => s.key === variables.site)?.label ?? variables.site;
        toast.success(`${label}站已${variables.listed ? '上架' : '下架'}`);
      } else {
        toast.error(data.message || '操作失败，请重试');
      }
    },
    onError: () => {
      toast.error('操作失败，请重试');
    }
  });

  const handleToggle = (site: ListingSite, listed: boolean) => {
    mutation.mutate({ productId: product.id, site, listed });
  };

  return (
    <Card className='mx-auto w-full max-w-3xl'>
      <CardHeader>
        <CardTitle className='text-left text-lg font-semibold'>站点上下架</CardTitle>
        <CardDescription>
          按站点单独控制该产品的上下架状态；未单独设置的站点跟随全局「
          {product.active ? '上架中' : '已下架'}」状态。
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3'>
        {LISTING_SITES.map(({ key, label }) => {
          const listed = product.site_listings?.[key] ?? product.active;
          return (
            <div
              key={key}
              className='flex items-center justify-between rounded-lg border px-4 py-3'
            >
              <div className='flex items-center gap-3'>
                <span className='font-medium'>{label}站</span>
                <Badge variant={listed ? 'outline' : 'secondary'}>
                  {listed ? '上架中' : '已下架'}
                </Badge>
              </div>
              <Switch
                checked={listed}
                disabled={mutation.isPending}
                onCheckedChange={(checked) => handleToggle(key, checked)}
                aria-label={`${label}站上下架`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
