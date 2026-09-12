'use client';

import { Bell, BellOff, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { toggleForumWatchAction } from '@/actions/help';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';

type ForumWatchButtonProps = {
  kind: 'board' | 'thread';
  id: string;
  watching: boolean;
  watchingBoard?: boolean;
};

export function ForumWatchButton({ kind, id, watching, watchingBoard = false }: ForumWatchButtonProps) {
  const t = useTranslations('help.forumPage');
  const router = useRouter();
  const [isWatching, setIsWatching] = useState(watching);
  const { executeAsync, isExecuting } = useAction(toggleForumWatchAction);
  const threadOnFollowedBoard = kind === 'thread' && watchingBoard;

  const label = isWatching
    ? threadOnFollowedBoard
      ? t('muteThread')
      : kind === 'board'
        ? t('unwatchBoard')
        : t('unwatchThread')
    : threadOnFollowedBoard
      ? t('unmuteThread')
      : kind === 'board'
        ? t('watchBoard')
        : t('watchThread');

  return (
    <div className="inline-flex">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-r-none"
        disabled={isExecuting}
        onClick={async () => {
          const result = await executeAsync({ kind, id });
          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }
          const nextWatching = result?.data && 'watching' in result.data ? Boolean(result.data.watching) : !isWatching;
          setIsWatching(nextWatching);
          if (threadOnFollowedBoard) {
            toast.success(nextWatching ? t('unmuteSuccess') : t('muteSuccess'));
          } else if (nextWatching) {
            toast.success(t('watchSuccess'));
          } else {
            toast.success(kind === 'board' ? t('unwatchSuccess') : t('unwatchThreadSuccess'));
          }
          router.refresh();
        }}
      >
        {isWatching ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
        {label}
      </Button>
      <Button asChild variant="outline" size="sm" className="rounded-l-none border-l-0 px-2">
        <Link href={{ pathname: '/account', hash: 'forum' }} aria-label={t('watchSettings')} title={t('watchSettings')}>
          <Settings className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
