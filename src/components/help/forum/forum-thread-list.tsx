'use client';

import { Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsInteger, useQueryState } from 'nuqs';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { FORUM_PAGE_SIZE } from '@/lib/help/forum-constants';
import { formatForumRelativeTime } from '@/lib/help/forum-time';
import { cn } from '@/lib/utils';
import type { ForumBoardRecord, ForumThreadListItem } from '@/types/forum';

import { ForumAvatar } from './forum-avatar';

type ForumThreadListProps = {
  board: ForumBoardRecord;
  threads: ForumThreadListItem[];
  total: number;
};

const forumPageParser = parseAsInteger.withDefault(1).withOptions({ shallow: false, history: 'replace' });

export function ForumThreadList({ board, threads, total }: ForumThreadListProps) {
  const t = useTranslations('help.forumPage');
  const [page, setPage] = useQueryState('page', forumPageParser);
  const pages = Math.max(1, Math.ceil(total / FORUM_PAGE_SIZE));

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        {board.description ? <p className="max-w-2xl text-muted-foreground">{board.description}</p> : null}
        <p className="text-sm text-muted-foreground">
          {board.moderators.length > 0
            ? `${t('moderators')}: ${board.moderators.map((mod) => mod.name).join(', ')}`
            : t('noModerators')}
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="space-y-3 py-8">
          <p className="text-muted-foreground">{t('emptyThreadsDescription')}</p>
          <Button asChild>
            <Link href={`/help/forum/${board.slug}/new`}>{t('emptyThreadsCta')}</Link>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/help/forum/${board.slug}/${thread.id}`}
              className="-mx-2 flex items-start gap-3 rounded-md px-2 py-4 transition-colors hover:bg-muted/30"
            >
              <ForumAvatar name={thread.author.name} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {thread.unread ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
                  {thread.pinned ? <Pin className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                  <span className={cn('font-medium', thread.unread && 'font-semibold')}>{thread.title}</span>
                  {thread.locked ? <Badge variant="outline">{t('locked')}</Badge> : null}
                  {thread.unread ? <span className="sr-only">{t('unread')}</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">{t('author', { name: thread.author.name })}</p>
              </div>
              <div className="shrink-0 text-right text-sm text-muted-foreground">
                <p>{t('replies', { count: thread.replyCount })}</p>
                <p>{formatForumRelativeTime(thread.lastPostedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => void setPage(page - 1)}>
            {t('pagePrev')}
          </Button>
          <p className="text-sm text-muted-foreground">{t('pageOf', { page, pages })}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => void setPage(page + 1)}
          >
            {t('pageNext')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
