'use client';

import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useOptimistic, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createForumPostAction, toggleForumReactionAction, updateForumPostAction } from '@/actions/help';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { FORUM_PAGE_SIZE, type ForumEmoji } from '@/lib/help/forum-constants';
import { applyForumOptimistic, createOptimisticForumPost, isOptimisticForumPostId } from '@/lib/help/forum-optimistic';
import { serializeRichTextBody } from '@/lib/schemas/rich-text';
import type { FaqTocArticle } from '@/types/faq';
import type { ForumAuthor, ForumBoardListItem, ForumPostNode, ForumThreadRecord } from '@/types/forum';

import { ForumPost } from './forum-post';
import { ForumThreadActions } from './forum-thread-actions';
import { ForumWatchButton } from './forum-watch-button';

type ForumThreadViewProps = {
  thread: ForumThreadRecord;
  boards: Pick<ForumBoardListItem, 'id' | 'name'>[];
  pickerArticles: Pick<FaqTocArticle, 'title' | 'slug'>[];
  currentUser: ForumAuthor;
  watchingThread?: boolean;
  watchingBoard?: boolean;
};

export function ForumThreadView({
  thread,
  boards,
  pickerArticles,
  currentUser,
  watchingThread = false,
  watchingBoard = false,
}: ForumThreadViewProps) {
  const t = useTranslations('help.forumPage');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false, history: 'replace' }),
  );
  const [composer, setComposer] = useState<{ mode: 'reply' | 'edit'; postId: string } | null>(null);
  const [optimisticThread, addOptimistic] = useOptimistic(thread, applyForumOptimistic);
  const { executeAsync: createPost } = useAction(createForumPostAction);
  const { executeAsync: updatePost } = useAction(updateForumPostAction);
  const { executeAsync: toggleReaction } = useAction(toggleForumReactionAction);

  const pages = Math.max(1, Math.ceil(optimisticThread.firstLevelTotal / FORUM_PAGE_SIZE));

  const onReact = (postId: string, emoji: ForumEmoji) => {
    if (isOptimisticForumPostId(postId) || isPending) return;
    startTransition(async () => {
      addOptimistic({ type: 'react', postId, emoji, userName: currentUser.name });
      const result = await toggleReaction({ postId, emoji });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      router.refresh();
    });
  };

  const onEditPost = (postId: string, body: unknown) => {
    if (isOptimisticForumPostId(postId) || isPending) return;
    setComposer(null);
    startTransition(async () => {
      addOptimistic({ type: 'edit', postId, body });
      const result = await updatePost({ id: postId, body: serializeRichTextBody(body) });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t('saved'));
      router.refresh();
    });
  };

  const onReplyToPost = (parent: ForumPostNode, body: unknown, watchThread = false) => {
    if (isOptimisticForumPostId(parent.id) || isPending) return;
    setComposer(null);
    const reply = createOptimisticForumPost({
      author: currentUser,
      body,
      parentId: parent.id,
    });
    const isFirstLevelReply = !parent.parentId;
    const lastPageAfterReply = Math.max(1, Math.ceil((optimisticThread.firstLevelTotal + 1) / FORUM_PAGE_SIZE));
    const showOptimisticReply = !isFirstLevelReply || page === lastPageAfterReply;
    startTransition(async () => {
      if (showOptimisticReply) {
        addOptimistic({ type: 'reply', parent, reply });
      }
      const result = await createPost({
        threadId: thread.id,
        parentId: parent.id,
        body: serializeRichTextBody(body),
        watchThread,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t('posted'));
      if (isFirstLevelReply && page !== lastPageAfterReply) {
        await setPage(lastPageAfterReply);
      }
      router.refresh();
    });
  };

  const postProps = {
    threadId: optimisticThread.id,
    boardSlug: optimisticThread.board.slug,
    locked: optimisticThread.locked,
    pickerArticles,
    composer,
    alreadyWatching: watchingThread,
    saving: isPending,
    onToggleReply: (postId: string) =>
      setComposer((current) =>
        current?.mode === 'reply' && current.postId === postId ? null : { mode: 'reply', postId },
      ),
    onToggleEdit: (postId: string) =>
      setComposer((current) =>
        current?.mode === 'edit' && current.postId === postId ? null : { mode: 'edit', postId },
      ),
    onCloseComposer: () => setComposer(null),
    onReact,
    onEditPost,
    onReplyToPost,
  };

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border/50 bg-[color-mix(in_oklab,var(--background)_45%,var(--card)_55%)]">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{optimisticThread.title}</h1>
              {optimisticThread.pinned ? <Badge variant="secondary">{t('pinned')}</Badge> : null}
              {optimisticThread.locked ? <Badge variant="outline">{t('locked')}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{t('author', { name: optimisticThread.author.name })}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ForumWatchButton
              key={`${optimisticThread.id}-${watchingThread}-${watchingBoard}`}
              kind="thread"
              id={optimisticThread.id}
              watching={watchingThread}
              watchingBoard={watchingBoard}
            />
            <ForumThreadActions thread={optimisticThread} boards={boards} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl pb-8">
        {optimisticThread.originalPost ? <ForumPost post={optimisticThread.originalPost} {...postProps} /> : null}

        {optimisticThread.firstLevelPosts.map((post) => (
          <ForumPost key={post.id} post={post} {...postProps} />
        ))}

        {pages > 1 ? (
          <div className="flex items-center justify-between gap-3 py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => void setPage(page - 1)}
            >
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

        {optimisticThread.locked ? <p className="py-4 text-sm text-muted-foreground">{t('lockedHint')}</p> : null}
      </div>
    </div>
  );
}
