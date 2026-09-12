'use client';

import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { unsubscribeForumWatchAction } from '@/actions/help';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';

type SubscriptionThread = { id: string; title: string; boardName: string; boardSlug: string };

export type ForumSubscriptionListProps = {
  boards: Array<{ id: string; name: string; slug: string }>;
  threads: SubscriptionThread[];
  mutes: SubscriptionThread[];
};

export function ForumSubscriptionList({ boards, threads, mutes }: ForumSubscriptionListProps) {
  const t = useTranslations('account.forum');
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(unsubscribeForumWatchAction);

  const empty = boards.length === 0 && threads.length === 0 && mutes.length === 0;

  const remove = async (kind: 'board' | 'thread' | 'mute', id: string, successKey: 'removed' | 'unmuted') => {
    const result = await executeAsync({ kind, id });
    if (result?.serverError) {
      toast.error(result.serverError || t('removeError'));
      return;
    }
    toast.success(t(successKey));
    router.refresh();
  };

  if (empty) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="space-y-6">
      {boards.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('boards')}</h3>
          <ul className="divide-y rounded-md border">
            {boards.map((board) => (
              <li key={board.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <Link href={`/help/forum/${board.slug}`} className="min-w-0 truncate text-sm hover:underline">
                  {board.name}
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isExecuting}
                  onClick={() => void remove('board', board.id, 'removed')}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {threads.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('threads')}</h3>
          <p className="text-xs text-muted-foreground">{t('threadsHint')}</p>
          <ul className="divide-y rounded-md border">
            {threads.map((thread) => (
              <li key={thread.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <Link
                    href={`/help/forum/${thread.boardSlug}/${thread.id}`}
                    className="block truncate text-sm hover:underline"
                  >
                    {thread.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{thread.boardName}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isExecuting}
                  onClick={() => void remove('thread', thread.id, 'removed')}
                >
                  {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mutes.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t('mutes')}</h3>
          <p className="text-xs text-muted-foreground">{t('mutesHint')}</p>
          <ul className="divide-y rounded-md border">
            {mutes.map((thread) => (
              <li key={thread.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <Link
                    href={`/help/forum/${thread.boardSlug}/${thread.id}`}
                    className="block truncate text-sm hover:underline"
                  >
                    {thread.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{thread.boardName}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isExecuting}
                  onClick={() => void remove('mute', thread.id, 'unmuted')}
                >
                  {t('unmute')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
