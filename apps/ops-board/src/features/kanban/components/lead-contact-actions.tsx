'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SITE_LABELS, type Lead } from '../api/types';
import { addFollowup } from '../api/service';

interface LeadContactActionsProps {
  lead: Lead;
}

const AUTO_LOG_CONTENT: Record<'whatsapp' | 'email', string> = {
  whatsapp: '通过 WhatsApp 一键触达',
  email: '通过邮件一键触达'
};

/** t.me 用户名/手机号白名单：@handle、handle、+数字。 */
function normalizeTelegramTarget(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\+?\d{7,15}$/.test(t)) return t.replace(/^\+/, '+'); // 手机号开 TG
  const handle = t.replace(/^@/, '');
  if (/^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(handle)) return handle;
  return null;
}

/**
 * 详情页「一键触达」：wa.me / mailto / t.me 链接，点击后打开对应客户端。
 * 未留电话时 WhatsApp 按钮禁用。预填文案用英文（面向海外客户）。
 * 点击的同时自动写一条跟进记录（channel=whatsapp/email/telegram）。
 * Telegram 没有存 handle 的字段 —— 弹窗里现场填（Google Maps / 社媒上查到的
 * @用户名 或 +手机号），打开 t.me 的同时照常记跟进。
 */
export function LeadContactActions({ lead }: LeadContactActionsProps) {
  const router = useRouter();
  const [tgOpen, setTgOpen] = useState(false);
  const [tgInput, setTgInput] = useState('');

  const logMutation = useMutation({
    mutationFn: (args: { channel: 'whatsapp' | 'email' | 'telegram'; content: string }) =>
      addFollowup(lead.id, { channel: args.channel, content: args.content }),
    onSuccess: () => router.refresh(),
    onError: () =>
      toast.error('触达已打开，但跟进记录写入失败', {
        description: '可在下方「记一笔」手动补一条'
      })
  });

  const autoLog = (channel: 'whatsapp' | 'email') => {
    if (!logMutation.isPending) {
      logMutation.mutate({ channel, content: AUTO_LOG_CONTENT[channel] });
    }
  };

  const siteLabel = SITE_LABELS[lead.site];
  const digits = lead.phone?.replace(/\D/g, '') ?? '';

  const brandText = lead.brands?.length ? ` (${lead.brands.join(', ')})` : '';
  const introText =
    `Hi${lead.company ? ` ${lead.company}` : ''}, this is ${siteLabel}. ` +
    `We received your wholesale inquiry${brandText} and would like to follow up.`;
  const waText = encodeURIComponent(introText);
  const mailSubject = encodeURIComponent(`Re: Your inquiry on ${siteLabel}`);

  const tgTarget = normalizeTelegramTarget(tgInput);
  const tgHref = tgTarget
    ? `https://t.me/${tgTarget.replace(/^\+/, '')}?text=${encodeURIComponent(introText)}`
    : '#';

  function openTelegram() {
    if (!tgTarget) {
      toast.error('Telegram 地址格式不对', {
        description: '填 @用户名（字母开头）或 +手机号'
      });
      return;
    }
    window.open(tgHref, '_blank', 'noreferrer');
    if (!logMutation.isPending) {
      logMutation.mutate({
        channel: 'telegram',
        content: `通过 Telegram 触达 ${tgTarget.startsWith('+') ? tgTarget : `@${tgTarget}`}`
      });
    }
    setTgOpen(false);
    setTgInput('');
  }

  return (
    <div className='flex flex-col gap-2'>
      {digits ? (
        <a
          href={`https://wa.me/${digits}?text=${waText}`}
          target='_blank'
          rel='noreferrer'
          onClick={() => autoLog('whatsapp')}
          className={cn(buttonVariants(), 'w-full')}
        >
          <Icons.chat /> WhatsApp 联系
        </a>
      ) : (
        <Button disabled className='w-full'>
          <Icons.chat /> WhatsApp（未留电话）
        </Button>
      )}
      <Button variant='outline' className='w-full' onClick={() => setTgOpen(true)}>
        <Icons.send /> Telegram 开发
      </Button>
      <a
        href={`mailto:${lead.email}?subject=${mailSubject}`}
        onClick={() => autoLog('email')}
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
      >
        <Icons.send /> 发送邮件
      </a>

      <Dialog open={tgOpen} onOpenChange={setTgOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Telegram 开发</DialogTitle>
            <DialogDescription>
              填客户的 Telegram @用户名 或 +手机号（Google Maps 店铺页 / 社媒资料里能查到），
              打开会话并自动记一条跟进。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={tgInput}
            onChange={(e) => setTgInput(e.target.value)}
            placeholder='@vapeshop_owner 或 +447xxxxxxxxx'
            onKeyDown={(e) => {
              if (e.key === 'Enter') openTelegram();
            }}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setTgOpen(false)}>
              取消
            </Button>
            <Button onClick={openTelegram} disabled={!tgTarget}>
              打开会话并记录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
