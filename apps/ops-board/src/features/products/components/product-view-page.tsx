'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { Product } from '../api/types';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { SiteListingCard } from './site-listing-card';
import { productByIdOptions } from '../api/queries';

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({ productId }: TProductViewPageProps) {
  if (productId === 'new') {
    return <ProductForm initialData={null} pageTitle='Create New Product' />;
  }

  return <EditProductView productId={productId} />;
}

function EditProductView({ productId }: { productId: string }) {
  const { data } = useSuspenseQuery(productByIdOptions(productId));

  if (!data?.success || !data?.product) {
    notFound();
  }

  const product = data.product as Product;

  return (
    <div className='flex flex-col gap-4'>
      <ProductForm initialData={product} pageTitle='Edit Product' />
      <SiteListingCard product={product} />
    </div>
  );
}
