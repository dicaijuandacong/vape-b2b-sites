'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { FieldGroup } from '@/components/ui/field';
import { useAppForm } from '@/lib/form';
import { FOLLOW_CHANNELS, FOLLOW_CHANNEL_LABELS } from '@/lib/followups';
import { addFollowup } from '../api/service';

const followupSchema = z.object({
  channel: z.enum(FOLLOW_CHANNELS),
  content: z.string().trim().min(1, '请填写跟进内容'),
  nextAction: z.string(),
  nextFollowAt: z.string()
});

type FollowupFormValues = z.infer<typeof followupSchema>;

const CHANNEL_OPTIONS = FOLLOW_CHANNELS.map((channel) => ({
  value: channel,
  label: FOLLOW_CHANNEL_LABELS[channel]
}));

interface LeadFollowupFormProps {
  leadId: string;
}

/** 询盘详情页「记一笔」：写一条跟进记录到飞书 Bitable followups 表。 */
export function LeadFollowupForm({ leadId }: LeadFollowupFormProps) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (values: FollowupFormValues) =>
      addFollowup(leadId, {
        channel: values.channel,
        content: values.content.trim(),
        ...(values.nextAction.trim() ? { nextAction: values.nextAction.trim() } : {}),
        ...(values.nextFollowAt
          ? { nextFollowAt: new Date(values.nextFollowAt).toISOString() }
          : {})
      }),
    onSuccess: () => {
      toast.success('跟进已记录');
      form.reset();
      router.refresh();
    },
    onError: (error) =>
      toast.error('跟进记录失败', {
        description: error instanceof Error ? error.message : undefined
      })
  });

  const form = useAppForm({
    defaultValues: {
      channel: 'whatsapp',
      content: '',
      nextAction: '',
      nextFollowAt: ''
    } as FollowupFormValues,
    validators: {
      onSubmit: followupSchema
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    }
  });

  return (
    <form
      className='flex flex-col gap-4'
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField
          name='channel'
          children={(field) => (
            <field.SelectField
              label='通道'
              required
              options={CHANNEL_OPTIONS}
              placeholder='选择通道'
            />
          )}
        />
        <form.AppField
          name='content'
          children={(field) => (
            <field.TextareaField
              label='跟进内容'
              required
              rows={3}
              maxLength={500}
              showCount
              placeholder='聊了啥、客户反馈、当前卡点…'
            />
          )}
        />
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <form.AppField
            name='nextAction'
            children={(field) => (
              <field.TextField label='下次动作（可选）' placeholder='如：发报价单' />
            )}
          />
          <form.AppField
            name='nextFollowAt'
            children={(field) => <field.TextField label='下次跟进日期（可选）' type='date' />}
          />
        </div>
      </FieldGroup>
      <div>
        <form.AppForm>
          <form.SubmitButton>记一笔</form.SubmitButton>
        </form.AppForm>
      </div>
    </form>
  );
}
