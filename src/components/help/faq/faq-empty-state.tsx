'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

type FaqEmptyStateProps = {
  isAdmin: boolean;
};

export function FaqEmptyState({ isAdmin }: FaqEmptyStateProps) {
  const t = useTranslations('help.faqPage');

  return (
    <div className="flex min-h-[12rem] flex-col items-start justify-center gap-3">
      <h2 className="text-xl font-semibold">{t('emptyTitle')}</h2>
      <p className="text-muted-foreground">{t('emptyDescription')}</p>
      {isAdmin ? (
        <Button asChild>
          <Link href="/help/faq/new">{t('emptyCta')}</Link>
        </Button>
      ) : null}
    </div>
  );
}
