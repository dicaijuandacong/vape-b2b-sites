import { z } from 'zod';

/**
 * 「新建订单」表单的 Zod 校验（onSubmit 时跑）。
 * 数字输入框清空后为 undefined，由这里的 required_error 给出中文提示。
 */
export const orderFormSchema = z.object({
  customer: z.string().trim().min(1, '请填写客户（公司名或邮箱）'),
  country: z.string().trim(),
  site: z.enum(['dubai', 'gulf', 'europe', 'vapegogogo'], {
    error: '请选择来源站点'
  }),
  currency: z.enum(['EUR', 'CNY', 'USD'], { error: '请选择币种' }),
  status: z.enum(['意向', '已付款', '已发货', '已完成', '已取消'], {
    error: '请选择状态'
  }),
  cost: z.number({ error: '成本需为数字' }).min(0, '成本不能为负').optional(),
  items: z
    .array(
      z.object({
        model: z.string().trim().min(1, '请填写型号'),
        qty: z.number({ error: '请填写数量' }).int('数量需为整数').min(1, '数量至少为 1'),
        unitPrice: z.number({ error: '请填写单价' }).min(0, '单价不能为负')
      })
    )
    .min(1, '至少一行商品')
});

export interface OrderFormItemValues {
  model: string;
  qty: number | undefined;
  unitPrice: number | undefined;
}

/** 表单内部值类型（数字框允许 undefined，提交前由 schema 兜底）。 */
export interface OrderFormValues {
  customer: string;
  country: string;
  site: 'dubai' | 'gulf' | 'europe' | 'vapegogogo';
  currency: 'EUR' | 'CNY' | 'USD';
  status: '意向' | '已付款' | '已发货' | '已完成' | '已取消';
  cost?: number | undefined;
  items: OrderFormItemValues[];
}
