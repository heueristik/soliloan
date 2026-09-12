'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { forumUserFromSession } from '@/lib/help/forum-permissions';
import {
  followForumThread,
  isForumBoardSubscribed,
  isForumThreadMuted,
  isForumThreadSubscribed,
  muteForumThread,
  subscribeToForumBoard,
  unmuteForumThread,
  unsubscribeFromForumBoard,
  unsubscribeFromForumThread,
} from '@/lib/help/forum-subscriptions';
import { revalidateForumPaths } from '@/lib/help/revalidate-forum';
import { forumWatchTargetSchema } from '@/lib/schemas/forum';
import { managerAction } from '@/lib/utils/safe-action';

function sessionUser(ctx: { session: { user: { id?: string | null; isAdmin?: boolean | null } } }) {
  return forumUserFromSession(ctx.session.user);
}

export const toggleForumWatchAction = managerAction
  .inputSchema(forumWatchTargetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = sessionUser(ctx).id;

    if (parsedInput.kind === 'thread') {
      const thread = await db.forumThread.findUnique({
        where: { id: parsedInput.id },
        select: { id: true, boardId: true },
      });
      if (!thread) {
        throw new Error('error.forum.threadNotFound');
      }

      const boardWatching = await isForumBoardSubscribed(userId, thread.boardId);
      if (boardWatching) {
        const muted = await isForumThreadMuted(userId, thread.id);
        if (muted) {
          await unmuteForumThread(userId, thread.id);
        } else {
          await muteForumThread(userId, thread.id);
        }
        revalidateForumPaths();
        revalidatePath('/account');
        return { watching: muted };
      }

      const watching = await isForumThreadSubscribed(userId, thread.id);
      if (watching) {
        await unsubscribeFromForumThread(userId, thread.id);
      } else {
        await followForumThread(userId, thread.id);
      }
      revalidateForumPaths();
      revalidatePath('/account');
      return { watching: !watching };
    }

    if (parsedInput.kind === 'mute') {
      const muted = await isForumThreadMuted(userId, parsedInput.id);
      if (muted) {
        await unmuteForumThread(userId, parsedInput.id);
      } else {
        await muteForumThread(userId, parsedInput.id);
      }
      revalidateForumPaths();
      revalidatePath('/account');
      return { watching: muted };
    }

    const board = await db.forumBoard.findUnique({
      where: { id: parsedInput.id },
      select: { id: true },
    });
    if (!board) {
      throw new Error('error.forum.boardNotFound');
    }
    const watching = await isForumBoardSubscribed(userId, board.id);
    if (watching) {
      await unsubscribeFromForumBoard(userId, board.id);
    } else {
      await subscribeToForumBoard(userId, board.id);
    }
    revalidateForumPaths();
    revalidatePath('/account');
    return { watching: !watching };
  });

export const unsubscribeForumWatchAction = managerAction
  .inputSchema(forumWatchTargetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = sessionUser(ctx).id;
    if (parsedInput.kind === 'thread') {
      await unsubscribeFromForumThread(userId, parsedInput.id);
    } else if (parsedInput.kind === 'mute') {
      await unmuteForumThread(userId, parsedInput.id);
    } else {
      await unsubscribeFromForumBoard(userId, parsedInput.id);
    }
    revalidateForumPaths();
    revalidatePath('/account');
    return { success: true };
  });
