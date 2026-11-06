'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { SITE_LABELS } from '@/features/kanban/api/types';
import { ORDER_CURRENCIES, ORDER_STATUSES, type CreateOrderInput } from '../api/types';
import { createOrder } from '../api/service';
import { orderFormSchema, type OrderFormValues } from '../schemas/order-form';

/** 「转为订单」预填（来自询盘详情页跳转）。 */
export interface NewOrderPrefill {
  leadId: string;
  customer: string;
  country?: string;
  site: OrderFormValues['site'];
}

interface NewOrderDialogProps {
  /** 从询盘跳转时自动打开弹窗并预填 */
  defaultOpen?: boolean;
  prefill?: NewOrderPrefill;
  /** 受控模式（表格空状态的「新建订单」按钮复用同一个弹窗） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const SITE_OPTIONS = (Object.keys(SITE_LABELS) as Array<keyof typeof SITE_LABELS>).map((key) => ({
  value: key,
  label: SITE_LABELS[key]
}));

const CURRENCY_OPTIONS = ORDER_CURRENCIES.map((currency) => ({
  value: currency,
  label: currency === 'EUR' ? 'EUR 欧元' : currency === 'CNY' ? 'CNY 人民币' : 'USD 美元'
}));

const STATUS_OPTIONS = ORDER_STATUSES.map((status) => ({ value: status, label: status }));

const EMPTY_ITEM = { model: '', qty: undefined, unitPrice: undefined };

/** 「新建订单」弹窗：客户/国家/站点/币种/状态 + 商品行（型号/数量/单价）。 */
export function NewOrderDialog({
  defaultOpen = false,
  prefill,
  open,
  onOpenChange,
  showTrigger = true
}: NewOrderDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };

  const mutation = useMutation({ mutationFn: createOrder });

  const form = useAppForm({
    defaultValues: {
      customer: prefill?.customer ?? '',
      country: prefill?.country ?? '',
      site: prefill?.site ?? 'europe',
      currency: 'EUR',
      status: '意向',
      cost: undefined,
      items: [{ ...EMPTY_ITEM }]
    } as OrderFormValues,
    validators: {
      onSubmit: orderFormSchema
    },
    onSubmit: ({ value }) => {
      const payload: CreateOrderInput = {
        customer: value.customer.trim(),
        site: value.site,
        currency: value.currency,
        status: value.status,
        items: value.items.map((item) => ({
          model: item.model.trim(),
          qty: item.qty!,
          unitPrice: item.unitPrice!
        }))
      };
      if (value.country.trim()) payload.country = value.country.trim();
      if (typeof value.cost === 'number') payload.cost = value.cost;
      if (prefill?.leadId) payload.leadId = prefill.leadId;

      mutation.mutate(payload, {
        onSuccess: () => {
          toast.success('订单已创建', { description: `客户 ${payload.customer}` });
          setDialogOpen(false);
          form.reset();
          router.refresh();
        },
        onError: (error) => {
          toast.error('订单创建失败', {
            description: error instanceof Error ? error.message : undefined
          });
        }
      });
    }
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button size='sm'>
              <Icons.add data-icon='inline-start' /> 新建订单
            </Button>
          }
        />
      )}
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>新建订单</DialogTitle>
          <DialogDescription>
            {prefill
              ? `已从询盘「${prefill.customer}」预填，补上商品和价格即可。`
              : '成交后在这里记一笔；总件数、总金额、利润自动计算。'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <div className='grid gap-4 sm:grid-cols-2'>
              <form.AppField
                name='customer'
                children={(field) => (
                  <field.TextField label='客户' required placeholder='公司名或邮箱' />
                )}
              />
              <form.AppField
                name='country'
                children={(field) => <field.TextField label='国家' placeholder='如 Germany' />}
              />
              <form.AppField
                name='site'
                children={(field) => (
                  <field.SelectField label='来源站点' required options={SITE_OPTIONS} />
                )}
              />
              <form.AppField
                name='currency'
                children={(field) => (
                  <field.SelectField label='币种' required options={CURRENCY_OPTIONS} />
                )}
              />
              <form.AppField
                name='status'
                children={(field) => (
                  <field.SelectField label='状态' required options={STATUS_OPTIONS} />
                )}
              />
              <form.AppField
                name='cost'
                children={(field) => (
                  <field.TextField
                    label='成本（¥，可选）'
                    type='number'
                    min={0}
                    step='0.01'
                    placeholder='人民币成本，用于算利润'
                  />
                )}
              />
            </div>

            <form.Field name='items' mode='array'>
              {(itemsField) => (
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>商品明细 *</span>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => itemsField.pushValue({ ...EMPTY_ITEM })}
                    >
                      <Icons.add data-icon='inline-start' /> 加一行
                    </Button>
                  </div>
                  {itemsField.state.value.map((_, index) => (
                    <div
                      key={index}
                      className='grid grid-cols-[1fr_5.5rem_6.5rem_2rem] items-end gap-2'
                    >
                      <form.AppField
                        name={`items[${index}].model`}
                        children={(field) => (
                          <field.TextField
                            label={index === 0 ? '型号' : ' '}
                            placeholder='如 ELF BAR BC5000'
                          />
                        )}
                      />
                      <form.AppField
                        name={`items[${index}].qty`}
                        children={(field) => (
                          <field.TextField
                            label={index === 0 ? '数量' : ' '}
                            type='number'
                            min={1}
                            step={1}
                            placeholder='件'
                          />
                        )}
                      />
                      <form.AppField
                        name={`items[${index}].unitPrice`}
                        children={(field) => (
                          <field.TextField
                            label={index === 0 ? '单价' : ' '}
                            type='number'
                            min={0}
                            step='0.01'
                            placeholder='单价'
                          />
                        )}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='mb-0.5'
                        aria-label='删除此行'
                        disabled={itemsField.state.value.length <= 1}
                        onClick={() => itemsField.removeValue(index)}
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </form.Field>

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <form.AppForm>
                <form.SubmitButton>创建订单</form.SubmitButton>
              </form.AppForm>
            </div>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
