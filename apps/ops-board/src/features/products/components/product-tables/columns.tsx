'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Product } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS, STATUS_OPTIONS, categoryLabel } from './options';
import { SiteListingBadges } from '../site-listing-badges';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'photo_url',
    header: '图片',
    cell: ({ row }) => {
      const src = row.getValue<string>('photo_url');
      return (
        <div className='bg-muted relative h-10 w-10 overflow-hidden rounded-md'>
          {src ? (
            <Image
              src={src}
              alt={row.getValue('name')}
              fill
              sizes='40px'
              className='object-cover'
            />
          ) : (
            <div className='text-muted-foreground flex h-full w-full items-center justify-center'>
              <Icons.media className='h-4 w-4' />
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='型号' />
    ),
    cell: ({ cell }) => <div className='font-medium'>{cell.getValue<Product['name']>()}</div>,
    meta: {
      label: '型号',
      placeholder: '搜索品牌、型号、口味…',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'brand',
    accessorKey: 'brand',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='品牌' />
    ),
    cell: ({ cell }) => <div>{cell.getValue<Product['brand']>()}</div>,
    meta: { label: '品牌' }
  },
  {
    id: 'puffs',
    accessorKey: 'puffs',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='口数' />
    ),
    cell: ({ cell }) => {
      const puffs = cell.getValue<Product['puffs']>();
      return <div>{typeof puffs === 'number' ? puffs.toLocaleString() : '—'}</div>;
    },
    meta: { label: '口数' }
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='价格 (€)' />
    ),
    cell: ({ cell }) => {
      const price = cell.getValue<Product['price']>();
      return <div>{typeof price === 'number' ? `€${price.toFixed(2)}` : '—'}</div>;
    },
    meta: { label: '价格' }
  },
  {
    id: 'category',
    accessorKey: 'category',
    enableSorting: false,
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='分类' />
    ),
    cell: ({ cell }) => {
      const category = cell.getValue<Product['category']>();
      return <Badge variant='outline'>{category ? categoryLabel(category) : '—'}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: '分类',
      variant: 'multiSelect',
      options: CATEGORY_OPTIONS
    }
  },
  {
    id: 'status',
    accessorFn: (row) => (row.active ? 'active' : 'inactive'),
    enableSorting: false,
    header: ({ column }: { column: Column<Product, unknown> }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const active = row.original.active;
      const Icon = active ? Icons.circleCheck : Icons.xCircle;
      return (
        <Badge variant={active ? 'outline' : 'secondary'}>
          <Icon />
          {active ? '上架中' : '已下架'}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: '状态',
      variant: 'multiSelect',
      options: STATUS_OPTIONS
    }
  },
  {
    id: 'site_listings',
    accessorKey: 'site_listings',
    enableSorting: false,
    header: '站点',
    cell: ({ row }) => <SiteListingBadges listings={row.original.site_listings} />,
    meta: { label: '站点' }
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
