'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Icons } from '@/components/icons';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

export const PRODUCT_VIEWS = ['grid', 'table'] as const;
export type ProductView = (typeof PRODUCT_VIEWS)[number];

export const viewParser = parseAsStringLiteral(PRODUCT_VIEWS).withDefault('grid');

export function ProductViewToggle() {
  const [view, setView] = useQueryState(
    'view',
    viewParser.withOptions({ shallow: true, history: 'replace' })
  );

  return (
    <ButtonGroup aria-label='切换视图'>
      <Button
        variant={view === 'grid' ? 'secondary' : 'outline'}
        size='sm'
        aria-pressed={view === 'grid'}
        onClick={() => setView('grid')}
      >
        <Icons.grid /> 网格
      </Button>
      <Button
        variant={view === 'table' ? 'secondary' : 'outline'}
        size='sm'
        aria-pressed={view === 'table'}
        onClick={() => setView('table')}
      >
        <Icons.list /> 表格
      </Button>
    </ButtonGroup>
  );
}
