'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 非管理员访问受限页面被 proxy 重定向到 /dashboard/overview?denied=1 时，
 * 弹出「无权限」提示并把 URL 清干净。
 */
export function DeniedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('denied')) {
      toast.error('无权限访问该页面');
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  return null;
}
