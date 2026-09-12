import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFaqTocUnsafe } from '@/actions/help';
import { FaqEmptyState } from '@/components/help/faq/faq-empty-state';
import { requireManager } from '@/lib/require-session';

export default async function FaqIndexPage() {
  const session = await requireManager();
  const isAdmin = Boolean(session.user.isAdmin);
  const toc = await getFaqTocUnsafe(isAdmin);
  const t = await getTranslations('help.faqPage');
  const isEmpty = toc.uncategorized.length === 0 && toc.categories.every((category) => category.articles.length === 0);

  if (isEmpty) {
    return <FaqEmptyState isAdmin={isAdmin} />;
  }

  const startArticle = toc.uncategorized[0];
  if (startArticle) {
    redirect(`/help/faq/${startArticle.slug}`);
  }

  return <p className="text-muted-foreground">{t('selectArticle')}</p>;
}
