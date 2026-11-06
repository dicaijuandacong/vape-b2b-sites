'use client';

import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { categoryOptions } from '@/features/products/constants/product-options';
import {
  productSchema,
  parseFlavors,
  parseTiers,
  formatTiers,
  type ProductFormValues
} from '@/features/products/schemas/product';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProductMutation, updateProductMutation } from '../api/mutations';
import type { Product, ProductMutationPayload } from '../api/types';

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: () => {
      toast.success('Product created');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error("Couldn't create product. Try again.");
    }
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: () => {
      toast.success('Product updated');
      router.push('/dashboard/product');
    },
    onError: () => {
      toast.error("Couldn't update product. Try again.");
    }
  });

  const form = useAppForm({
    defaultValues: {
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? initialData?.name ?? '',
      puffs: initialData?.puffs,
      category: initialData?.category ?? '',
      description: initialData?.description ?? '',
      flavorsText: initialData?.flavors?.join('\n') ?? '',
      tiersText: initialData?.tiers ? formatTiers(initialData.tiers) : '',
      active: initialData?.active ?? true
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: ({ value }) => {
      const tiers = parseTiers(value.tiersText);
      const payload: ProductMutationPayload = {
        name: value.model,
        brand: value.brand,
        model: value.model,
        puffs: value.puffs!,
        category: value.category,
        price: tiers[0]?.price_eur ?? 0,
        description: value.description,
        flavors: parseFlavors(value.flavorsText),
        tiers,
        active: value.active
      };

      if (isEdit) {
        updateMutation.mutate({ id: initialData.id, values: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card className='mx-auto w-full max-w-3xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-8'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <form.AppField
                name='brand'
                children={(field) => (
                  <field.TextField label='Brand' required placeholder='e.g. VOZOL' />
                )}
              />

              <form.AppField
                name='model'
                children={(field) => (
                  <field.TextField label='Model' required placeholder='e.g. STAR 6000' />
                )}
              />

              <form.AppField
                name='puffs'
                children={(field) => (
                  <field.TextField
                    label='Puffs'
                    required
                    type='number'
                    min={0}
                    step={1}
                    placeholder='e.g. 6000'
                  />
                )}
              />

              <form.AppField
                name='category'
                children={(field) => (
                  <field.SelectField
                    label='Category'
                    required
                    options={categoryOptions}
                    placeholder='Select category'
                  />
                )}
              />
            </div>

            <form.AppField
              name='description'
              children={(field) => (
                <field.TextareaField
                  label='Description'
                  placeholder='Optional — a summary is derived from brand/model/puffs when empty'
                  rows={3}
                />
              )}
            />

            <form.AppField
              name='flavorsText'
              children={(field) => (
                <field.TextareaField
                  label='Flavors'
                  required
                  description='One flavor per line, or comma separated.'
                  placeholder={'Watermelon Ice\nCool Mint\nGrape Ice'}
                  rows={5}
                />
              )}
            />

            <form.AppField
              name='tiersText'
              children={(field) => (
                <field.TextareaField
                  label='Price Tiers (EUR)'
                  required
                  description='One tier per line as MOQ:price, e.g. 400:4.66'
                  placeholder={'400:4.66\n1000:4.20'}
                  rows={3}
                />
              )}
            />

            <form.AppField
              name='active'
              children={(field) => (
                <field.SwitchField
                  label='Active (上架)'
                  description='Inactive SKUs are soft-deleted (下架) and hidden from the default list.'
                />
              )}
            />
          </FieldGroup>

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => router.back()}>
              Cancel
            </Button>
            <LoadingButton loading={isPending} type='submit'>
              {isEdit ? 'Update Product' : 'Add Product'}
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
