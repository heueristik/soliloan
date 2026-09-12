'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';

import { FormCheckbox } from '@/components/form/form-checkbox';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { EMPTY_FAQ_DOC } from '@/lib/help/faq-constants';
import { forumPostFormSchema } from '@/lib/schemas/forum';
import type { FaqTocArticle } from '@/types/faq';

import { ForumPostFormFields } from './forum-post-form-fields';

type ForumPostFormProps = {
  pickerArticles: Pick<FaqTocArticle, 'title' | 'slug'>[];
  compact?: boolean;
  onCancel?: () => void;
  onSave: (body: unknown, options?: { watchThread?: boolean }) => void;
  saving?: boolean;
} & (
  | { mode: 'reply'; threadId: string; parentId: string; initialBody?: never; postId?: never }
  | { mode: 'edit'; postId: string; initialBody: unknown; threadId?: never; parentId?: never }
);

export function ForumPostForm(props: ForumPostFormProps) {
  const { pickerArticles, compact = true, onCancel, onSave, saving = false } = props;
  const t = useTranslations('help.postForm');
  const tUi = useTranslations('common.ui.actions');
  const submittedRef = useRef(false);
  const isReply = props.mode === 'reply';

  const form = useForm({
    resolver: zodResolver(forumPostFormSchema.pick({ body: true, watchThread: true })),
    defaultValues: {
      body: props.mode === 'edit' ? (props.initialBody ?? EMPTY_FAQ_DOC) : EMPTY_FAQ_DOC,
      watchThread: false,
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (saving || submittedRef.current) return;
    submittedRef.current = true;
    onSave(data.body, isReply ? { watchThread: data.watchThread === true } : undefined);
  });

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleSubmit();
        }}
      >
        <ForumPostFormFields pickerArticles={pickerArticles} label={t('body')} compact={compact} />
        {isReply ? <FormCheckbox name="watchThread" label={t('watchThread')} hint={t('watchThreadHint')} /> : null}
        <div className="flex justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              {tUi('cancel')}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={saving}>
            {props.mode === 'edit' ? t('save') : t('submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
