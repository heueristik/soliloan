'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { updateForumDigestDelayAction } from '@/actions/account/mutations/update-forum-digest-delay';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { clampForumDigestDelayMinutes, FORUM_DIGEST_DEFAULT_DELAY_MINUTES } from '@/lib/help/forum-constants';
import type { UpdateForumDigestDelayFormValues } from '@/lib/schemas/account';
import { updateForumDigestDelayFormSchema } from '@/lib/schemas/account';

import { ForumDigestDelayFormFields } from './forum-digest-delay-form-fields';

type ForumDigestDelayFormProps = {
  forumDigestDelayMinutes: number;
};

export function ForumDigestDelayForm({ forumDigestDelayMinutes }: ForumDigestDelayFormProps) {
  const t = useTranslations('account.forum');
  const delayValue = String(
    clampForumDigestDelayMinutes(forumDigestDelayMinutes || FORUM_DIGEST_DEFAULT_DELAY_MINUTES),
  ) as UpdateForumDigestDelayFormValues['forumDigestDelayMinutes'];
  const form = useForm<UpdateForumDigestDelayFormValues>({
    resolver: zodResolver(updateForumDigestDelayFormSchema),
    defaultValues: {
      forumDigestDelayMinutes: delayValue,
    },
  });

  const { execute, isPending } = useAction(updateForumDigestDelayAction, {
    onSuccess: () => {
      toast.success(t('success'));
    },
    onError: ({ error }) => {
      toast.error(error.serverError || t('error'));
    },
  });

  const handleSubmit = form.handleSubmit((data: UpdateForumDigestDelayFormValues) => {
    execute({ forumDigestDelayMinutes: Number(data.forumDigestDelayMinutes) });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <ForumDigestDelayFormFields />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
