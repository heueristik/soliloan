import { db } from '@/lib/db';
import type { HelpSearchHit, HelpSearchPrimary, HelpSearchResults } from '@/types/help-search';

export const HELP_SEARCH_PRIMARY_LIMIT = 8;
export const HELP_SEARCH_SECONDARY_LIMIT = 4;

const SNIPPET_RADIUS = 72;
const FETCH_BUFFER = 3;
const containsMode = 'insensitive' as const;

function likeContains(query: string) {
  return query.replace(/[\\%_]/g, '\\$&');
}

function collapseSearchText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function excerptAround(text: string, query: string, radius = SNIPPET_RADIUS) {
  const normalized = collapseSearchText(text);
  if (!normalized) return '';
  const needle = query.trim().toLowerCase();
  const idx = normalized.toLowerCase().indexOf(needle);
  if (idx < 0) {
    return normalized.length > radius * 2 ? `${normalized.slice(0, radius * 2).trim()}…` : normalized;
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(normalized.length, idx + needle.length + radius);
  return `${start > 0 ? '…' : ''}${normalized.slice(start, end).trim()}${end < normalized.length ? '…' : ''}`;
}

function includesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function rankTitleFirst<T extends { titleMatch: boolean; at: Date }>(rows: T[], limit: number) {
  return [...rows]
    .sort((left, right) => {
      if (left.titleMatch !== right.titleMatch) return left.titleMatch ? -1 : 1;
      return right.at.getTime() - left.at.getTime();
    })
    .slice(0, limit);
}

export async function findHelpSearch(options: {
  query: string;
  primary: HelpSearchPrimary;
  includeUnpublished: boolean;
}): Promise<HelpSearchResults> {
  const query = options.query.trim();
  const contains = { contains: likeContains(query), mode: containsMode };
  const forumLimit = options.primary === 'forum' ? HELP_SEARCH_PRIMARY_LIMIT : HELP_SEARCH_SECONDARY_LIMIT;
  const faqLimit = options.primary === 'faq' ? HELP_SEARCH_PRIMARY_LIMIT : HELP_SEARCH_SECONDARY_LIMIT;

  const [threads, articles] = await Promise.all([
    db.forumThread.findMany({
      where: {
        OR: [{ title: contains }, { posts: { some: { searchText: contains } } }],
      },
      orderBy: { lastPostedAt: 'desc' },
      take: forumLimit * FETCH_BUFFER,
      select: {
        id: true,
        title: true,
        lastPostedAt: true,
        board: { select: { name: true, slug: true } },
        posts: {
          where: { searchText: contains },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { searchText: true },
        },
      },
    }),
    db.faqArticle.findMany({
      where: {
        ...(options.includeUnpublished ? {} : { published: true }),
        OR: [{ title: contains }, { searchText: contains }],
      },
      orderBy: { updatedAt: 'desc' },
      take: faqLimit * FETCH_BUFFER,
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        searchText: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const forum = rankTitleFirst(
    threads.map((thread) => ({
      titleMatch: includesQuery(thread.title, query),
      at: thread.lastPostedAt,
      hit: {
        id: thread.id,
        kind: 'forum' as const,
        title: thread.title,
        href: `/help/forum/${thread.board.slug}/${thread.id}`,
        meta: thread.board.name,
        snippet: thread.posts[0] ? excerptAround(thread.posts[0].searchText, query) : '',
      } satisfies HelpSearchHit,
    })),
    forumLimit,
  ).map((row) => row.hit);

  const faq = rankTitleFirst(
    articles.map((article) => ({
      titleMatch: includesQuery(article.title, query),
      at: article.updatedAt,
      hit: {
        id: article.id,
        kind: 'faq' as const,
        title: article.title,
        href: `/help/faq/${article.slug}`,
        meta: article.category?.name ?? '',
        snippet: includesQuery(article.searchText, query) ? excerptAround(article.searchText, query) : '',
        draft: article.published ? undefined : true,
      } satisfies HelpSearchHit,
    })),
    faqLimit,
  ).map((row) => row.hit);

  return { forum, faq };
}
