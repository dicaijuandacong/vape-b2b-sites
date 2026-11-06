'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFacetedFilter } from '@/components/ui/table/data-table-faceted-filter';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { Table } from '@tanstack/react-table';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { productsQueryOptions } from '../../api/queries';
import type { Product } from '../../api/types';
import { ProductGrid } from '../product-grid';
import { columns } from './columns';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from './options';
import { ProductViewToggle, viewParser } from './view-toggle';
import { Icons } from '@/components/icons';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function ProductTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    status: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([]),
    view: viewParser
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { categories: params.category }),
    ...(params.status && { status: params.status }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data } = useSuspenseQuery(productsQueryOptions(filters));

  const pageCount = Math.ceil(data.total_products / params.perPage);

  const { table } = useDataTable({
    data: data.products,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  if (params.view === 'grid') {
    return (
      <div className='flex flex-1 flex-col space-y-4'>
        <ProductGridToolbar table={table} />
        <ProductGrid products={data.products} />
        <DataTablePagination table={table} />
      </div>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <ProductViewToggle />
      </DataTableToolbar>
    </DataTable>
  );
}

/**
 * Grid-view toolbar — same filter wiring as DataTableToolbar (column filters
 * sync to the URL via useDataTable), minus the column-visibility dropdown
 * which is meaningless without a rendered table.
 */
function ProductGridToolbar({ table }: { table: Table<Product> }) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const nameColumn = table.getColumn('name');
  const categoryColumn = table.getColumn('category');
  const statusColumn = table.getColumn('status');

  return (
    <div
      role='toolbar'
      aria-orientation='horizontal'
      className='flex w-full items-start justify-between gap-2 p-1'
    >
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='搜索品牌、型号、口味…'
          aria-label='搜索产品'
          value={(nameColumn?.getFilterValue() as string) ?? ''}
          onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
          className='h-8 w-40 lg:w-56'
        />
        {categoryColumn && (
          <DataTableFacetedFilter
            column={categoryColumn}
            title='分类'
            options={CATEGORY_OPTIONS}
            multiple
          />
        )}
        {statusColumn && (
          <DataTableFacetedFilter
            column={statusColumn}
            title='状态'
            options={STATUS_OPTIONS}
            multiple
          />
        )}
        {isFiltered && (
          <Button
            aria-label='重置筛选'
            variant='outline'
            size='sm'
            className='border-dashed'
            onClick={() => table.resetColumnFilters()}
          >
            <Icons.close />
            重置
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <ProductViewToggle />
      </div>
    </div>
  );
}
