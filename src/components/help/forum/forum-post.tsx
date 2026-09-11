'use client';

import type { JSONContent } from '@tiptap/core';
import { CornerDownRight, Link2, Pencil, Reply, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

import { deleteForumPostAction } from '@/actions/help';
import { FaqTiptapRenderer } from '@/components/help/faq/faq-tiptap-renderer';
import { ActionButton } from '@/components/ui/action-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from '@/i18n/navigation';
import type { ForumEmoji } from '@/lib/help/forum-constants';
import { isOptimisticForumPostId } from '@/lib/help/forum-optimistic';
import { formatForumAbsoluteTime, formatForumRelativeTime } from '@/lib/help/forum-time';
import { cn } from '@/lib/utils';
import type { FaqTocArticle } from '@/types/faq';
import type { ForumPostNode } from '@/types/forum';

import { ForumAvatar } from './forum-avatar';
import { ForumPostForm } from './forum-post-form';
import { ForumReactions } from './forum-reactions';

type ForumPostComposer = { mode: 'reply' | 'edit'; postId: string } | null;

type ForumPostProps = {
  post: ForumPostNode;
  threadId: string;
  boardSlug: string;
  locked: boolean;
  pickerArticles: Pick<FaqTocArticle, 'title' | 'slug'>[];
  composer: ForumPostComposer;
  onToggleReply: (postId: string) => void;
  onToggleEdit: (postId: string) => void;
  onCloseComposer: () => void;
  onReact: (postId: string, emoji: ForumEmoji) => void;
  onEditPost: (postId: string, body: unknown) => void;
  onReplyToPost: (parent: ForumPostNode, body: unknown) => void;
  saving?: boolean;
  depth?: number;
};

export function ForumPost({
  post,
  threadId,
  boardSlug,
  locked,
  pickerArticles,
  composer,
  onToggleReply,
  onToggleEdit,
  onCloseComposer,
  onReact,
  onEditPost,
  onReplyToPost,
  saving = false,
  depth = 0,
}: ForumPostProps) {
  const t = useTranslations('help.forumPage');
  const tUi = useTranslations('common.ui.actions');
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { executeAsync: remove, isExecuting } = useAction(deleteForumPostAction);
  const pending = isOptimisticForumPostId(post.id);
  const editing = !pending && composer?.mode === 'edit' && composer.postId === post.id;
  const replying = !pending && composer?.mode === 'reply' && composer.postId === post.id;

  const copyPermalink = async () => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#post-${post.id}`;
    await navigator.clipboard.writeText(url);
    toast.success(t('permalinkCopied'));
  };

  const hasReplies = post.replies.length > 0;

  return (
    <div className={cn(depth > 0 && 'pl-6', hasReplies && 'border-b border-border/20')}>
      <article
        id={`post-${post.id}`}
        className={cn(
          'flex scroll-mt-24 gap-3 py-4',
          depth > 0 && 'border-t border-border/20',
          !hasReplies && depth === 0 && 'border-b border-border/20',
        )}
      >
        {depth > 0 ? <CornerDownRight className="mt-2 size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
        <ForumAvatar name={post.author.name} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm leading-none font-medium">{post.author.name}</span>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="cursor-default border-0 bg-transparent p-0 text-xs leading-none text-muted-foreground"
                  >
                    <time dateTime={new Date(post.createdAt).toISOString()}>
                      {formatForumRelativeTime(post.createdAt)}
                      {post.editedAt ? ` · ${t('edited')}` : ''}
                    </time>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{formatForumAbsoluteTime(post.createdAt)}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {editing ? (
            <ForumPostForm
              mode="edit"
              postId={post.id}
              initialBody={post.body}
              pickerArticles={pickerArticles}
              saving={saving}
              onCancel={onCloseComposer}
              onSave={(body) => onEditPost(post.id, body)}
            />
          ) : (
            <FaqTiptapRenderer content={post.body as JSONContent} headings={false} />
          )}

          {pending ? null : (
            <div className="flex flex-wrap items-center justify-end gap-1">
              <ForumReactions reactions={post.reactions} onToggle={(emoji) => onReact(post.id, emoji)} />
              {!locked && !editing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                  disabled={saving}
                  onClick={() => onToggleReply(post.id)}
                >
                  <Reply className="h-3.5 w-3.5" />
                  {t('reply')}
                </Button>
              ) : null}
              {post.canEdit && !editing ? (
                <ActionButton
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  tooltip={tUi('edit')}
                  srOnly={tUi('edit')}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  disabled={saving}
                  onClick={() => onToggleEdit(post.id)}
                />
              ) : null}
              {post.canDelete ? (
                <ActionButton
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  tooltip={tUi('delete')}
                  srOnly={tUi('delete')}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                />
              ) : null}
              <ActionButton
                icon={<Link2 className="h-3.5 w-3.5" />}
                tooltip={t('permalink')}
                srOnly={t('permalink')}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => void copyPermalink()}
              />
            </div>
          )}

          {replying && !locked ? (
            <div className="pt-2">
              <p className="mb-2 text-sm text-muted-foreground">{t('replyTo', { name: post.author.name })}</p>
              <ForumPostForm
                mode="reply"
                threadId={threadId}
                parentId={post.id}
                pickerArticles={pickerArticles}
                saving={saving}
                onCancel={onCloseComposer}
                onSave={(body) => onReplyToPost(post, body)}
              />
            </div>
          ) : null}
        </div>
      </article>

      {post.replies.map((reply) => (
        <ForumPost
          key={reply.id}
          post={reply}
          threadId={threadId}
          boardSlug={boardSlug}
          locked={locked}
          pickerArticles={pickerArticles}
          composer={composer}
          saving={saving}
          onToggleReply={onToggleReply}
          onToggleEdit={onToggleEdit}
          onCloseComposer={onCloseComposer}
          onReact={onReact}
          onEditPost={onEditPost}
          onReplyToPost={onReplyToPost}
          depth={depth + 1}
        />
      ))}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePostTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deletePostDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tUi('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={isExecuting}
              onClick={async () => {
                const result = await remove({ id: post.id });
                if (result?.serverError) {
                  toast.error(result.serverError);
                  return;
                }
                toast.success(t('deleted'));
                if (result?.data && 'deletedThread' in result.data && result.data.deletedThread) {
                  router.push(`/help/forum/${boardSlug}`);
                }
                router.refresh();
              }}
            >
              {tUi('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
