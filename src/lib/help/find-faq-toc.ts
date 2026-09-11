import { cache } from 'react';

import { db } from '@/lib/db';
import type { FaqToc, FaqTocArticle } from '@/types/faq';

const articleSelect = {
  id: true,
  title: true,
  slug: true,
  position: true,
  published: true,
  searchText: true,
  categoryId: true,
} satisfies Record<string, boolean>;

function toTocArticle(article: {
  id: string;
  title: string;
  slug: string;
  position: number;
  published: boolean;
  searchText: string;
  categoryId: string | null;
}): FaqTocArticle {
  return article;
}

export const findFaqToc = cache(async (includeUnpublished: boolean): Promise<FaqToc> => {
  const publishedFilter = includeUnpublished ? undefined : { published: true };

  const [uncategorized, categories] = await Promise.all([
    db.faqArticle.findMany({
      where: { categoryId: null, ...publishedFilter },
      orderBy: { position: 'asc' },
      select: articleSelect,
    }),
    db.faqCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        articles: {
          where: publishedFilter,
          orderBy: { position: 'asc' },
          select: articleSelect,
        },
      },
    }),
  ]);

  return {
    uncategorized: uncategorized.map(toTocArticle),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      position: category.position,
      articles: category.articles.map(toTocArticle),
    })),
  };
});
