'use client';

/**
 * 询盘详情「编辑客户信息」弹窗：改公司/国家/电话/意向品牌/量级/备注，写回飞书。
 * 邮箱/来源站/类型不可改（避免破坏归因）。
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import type { Lead } from '../api/types';

export function LeadEditDialog({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company: lead.company ?? '',
    country: lead.country ?? '',
    phone: lead.phone ?? '',
    brands: lead.brands?.join(', ') ?? '',
    volume: lead.volume ?? '',
    notes: lead.notes ?? ''
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/leads/${lead.id}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: form.company,
          country: form.country,
          phone: form.phone,
          brands: form.brands
            .split(/[,，、]/)
            .map((s) => s.trim())
            .filter(Boolean),
          volume: form.volume,
          notes: form.notes
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      toast.success('客户信息已保存');
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error('保存失败，请重试')
  });

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant='outline' size='sm' className='text-xs'>
            <Icons.edit className='mr-1 h-3.5 w-3.5' /> 编辑客户信息
          </Button>
        }
      />
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>编辑客户信息</DialogTitle>
          <DialogDescription>
            只改联系人相关内容（公司/国家/电话/品牌/量级/备注）。邮箱、来源站、类型不可改。
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3'>
          <label className='flex flex-col gap-1 text-xs'>
            <span className='text-muted-foreground'>公司</span>
            <Input value={form.company} onChange={set('company')} placeholder='公司名' />
          </label>
          <div className='grid grid-cols-2 gap-3'>
            <label className='flex flex-col gap-1 text-xs'>
              <span className='text-muted-foreground'>国家</span>
              <Input value={form.country} onChange={set('country')} placeholder='例：Germany' />
            </label>
            <label className='flex flex-col gap-1 text-xs'>
              <span className='text-muted-foreground'>电话</span>
              <Input value={form.phone} onChange={set('phone')} placeholder='+49...' />
            </label>
          </div>
          <label className='flex flex-col gap-1 text-xs'>
            <span className='text-muted-foreground'>意向品牌（逗号分隔）</span>
            <Input value={form.brands} onChange={set('brands')} placeholder='GEEK BAR, VAPORESSO' />
          </label>
          <label className='flex flex-col gap-1 text-xs'>
            <span className='text-muted-foreground'>采购量级</span>
            <Input value={form.volume} onChange={set('volume')} placeholder='例：5000 支/月' />
          </label>
          <label className='flex flex-col gap-1 text-xs'>
            <span className='text-muted-foreground'>备注</span>
            <Textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder='客户背景/特殊要求'
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
