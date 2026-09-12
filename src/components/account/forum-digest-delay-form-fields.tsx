'use client';

import { useTranslations } from 'next-intl';

import { FormSelect } from '@/components/form/form-select';
import { FORUM_DIGEST_DELAY_MINUTES } from '@/lib/help/forum-constants';

export function ForumDigestDelayFormFields() {
  const t = useTranslations('account.forum');

  return (
    <FormSelect
      name="forumDigestDelayMinutes"
      label={t('delay')}
      placeholder={t('delayPlaceholder')}
      hint={t('delayHint')}
      options={FORUM_DIGEST_DELAY_MINUTES.map((minutes) => ({
        value: String(minutes),
        label: t(`delayOptions.${minutes}`),
      }))}
    />
  );
}
