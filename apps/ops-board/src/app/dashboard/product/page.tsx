import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import ProductListingPage from '@/features/products/components/product-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { productInfoContent } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: 产品管理'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='产品管理'
      pageDescription='浏览与管理全部 SKU：品牌、口数、批发价与上下架状态。'
      infoContent={productInfoContent}
      pageHeaderAction={
        <Link href='/dashboard/product/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> 新增产品
        </Link>
      }
    >
      <ProductListingPage />
    </PageContainer>
  );
}
