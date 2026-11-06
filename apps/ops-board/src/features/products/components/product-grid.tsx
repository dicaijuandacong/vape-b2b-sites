'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { Product } from '../api/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CellAction } from './product-tables/cell-action';
import { categoryLabel } from './product-tables/options';
import { SiteListingBadges } from './site-listing-badges';

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center'>
        <Icons.product className='text-muted-foreground h-8 w-8' />
        <p className='text-muted-foreground text-sm'>没有符合条件的产品</p>
      </div>
    );
  }

  return (
    <div className='grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const active = product.active;
  const StatusIcon = active ? Icons.circleCheck : Icons.xCircle;
  const href = `/dashboard/product/${product.id}`;

  return (
    <Card
      role='link'
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') router.push(href);
      }}
      className='cursor-pointer gap-0 py-0 transition-shadow hover:shadow-md'
    >
      <div className='bg-muted relative aspect-square w-full overflow-hidden rounded-t-xl'>
        {product.photo_url ? (
          <Image
            src={product.photo_url}
            alt={product.model}
            fill
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 20vw'
            className='object-cover'
          />
        ) : (
          <div className='text-muted-foreground flex h-full w-full items-center justify-center'>
            <Icons.media className='h-10 w-10' />
          </div>
        )}
        <Badge
          variant={active ? 'outline' : 'secondary'}
          className='bg-background/85 absolute top-2 left-2 backdrop-blur-sm'
        >
          <StatusIcon />
          {active ? '上架中' : '已下架'}
        </Badge>
      </div>
      <div className='flex flex-col gap-1.5 p-3'>
        <div className='flex items-start justify-between gap-1'>
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className='line-clamp-1 font-semibold hover:underline'
          >
            {product.model}
          </Link>
          <div onClick={(e) => e.stopPropagation()} className='-mt-1 -mr-2 shrink-0'>
            <CellAction data={product} />
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-1'>
          <Badge variant='outline'>{product.brand ?? '—'}</Badge>
          <Badge variant='outline'>
            {product.category ? categoryLabel(product.category) : '—'}
          </Badge>
        </div>
        <SiteListingBadges listings={product.site_listings} />
        <div className='flex items-baseline justify-between text-sm'>
          <span className='text-muted-foreground'>
            {typeof product.puffs === 'number' ? product.puffs.toLocaleString() : '—'} 口
          </span>
          <span className='font-semibold'>
            {typeof product.price === 'number' ? `€${product.price.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>
    </Card>
  );
}
