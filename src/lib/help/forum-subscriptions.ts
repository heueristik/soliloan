import { db } from '@/lib/db';
import { clampForumDigestDelayMinutes } from '@/lib/help/forum-constants';

function isManagerUser(user: { isAdmin?: boolean | null; _count?: { managerOf: number } }) {
  return Boolean(user.isAdmin) || (user._count?.managerOf ?? 0) > 0;
}

export async function subscribeToForumThread(userId: string, threadId: string) {
  await db.forumThreadSubscription.upsert({
    where: { userId_threadId: { userId, threadId } },
    create: { userId, threadId },
    update: {},
  });
}

export async function unsubscribeFromForumThread(userId: string, threadId: string) {
  await db.forumThreadSubscription.deleteMany({
    where: { userId, threadId },
  });
}

export async function muteForumThread(userId: string, threadId: string) {
  await db.$transaction([
    db.forumThreadMute.upsert({
      where: { userId_threadId: { userId, threadId } },
      create: { userId, threadId },
      update: {},
    }),
    db.forumThreadSubscription.deleteMany({
      where: { userId, threadId },
    }),
  ]);
}

export async function unmuteForumThread(userId: string, threadId: string) {
  await db.forumThreadMute.deleteMany({
    where: { userId, threadId },
  });
}

export async function followForumThread(userId: string, threadId: string) {
  await subscribeToForumThread(userId, threadId);
  await unmuteForumThread(userId, threadId);
}

export async function subscribeToForumBoard(userId: string, boardId: string) {
  await db.forumBoardSubscription.upsert({
    where: { userId_boardId: { userId, boardId } },
    create: { userId, boardId },
    update: {},
  });
}

export async function unsubscribeFromForumBoard(userId: string, boardId: string) {
  await db.forumBoardSubscription.deleteMany({
    where: { userId, boardId },
  });
}

export async function isForumThreadSubscribed(userId: string, threadId: string) {
  const row = await db.forumThreadSubscription.findUnique({
    where: { userId_threadId: { userId, threadId } },
    select: { userId: true },
  });
  return Boolean(row);
}

export async function isForumThreadMuted(userId: string, threadId: string) {
  const row = await db.forumThreadMute.findUnique({
    where: { userId_threadId: { userId, threadId } },
    select: { userId: true },
  });
  return Boolean(row);
}

export async function isForumBoardSubscribed(userId: string, boardId: string) {
  const row = await db.forumBoardSubscription.findUnique({
    where: { userId_boardId: { userId, boardId } },
    select: { userId: true },
  });
  return Boolean(row);
}

export async function getForumThreadWatchState(userId: string, threadId: string, boardId: string) {
  const [boardWatching, threadFollowed, threadMuted] = await Promise.all([
    isForumBoardSubscribed(userId, boardId),
    isForumThreadSubscribed(userId, threadId),
    isForumThreadMuted(userId, threadId),
  ]);
  return {
    boardWatching,
    threadFollowed,
    threadMuted,
    watchingThread: boardWatching ? !threadMuted : threadFollowed,
  };
}

export async function armForumDigest(userId: string, now = new Date()) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      isAdmin: true,
      forumDigestDueAt: true,
      forumDigestDelayMinutes: true,
      _count: { select: { managerOf: true } },
    },
  });
  if (!user?.email?.trim() || !isManagerUser(user)) return;
  if (user.forumDigestDueAt) return;

  const delayMinutes = clampForumDigestDelayMinutes(user.forumDigestDelayMinutes);
  await db.user.updateMany({
    where: { id: userId, forumDigestDueAt: null },
    data: { forumDigestDueAt: new Date(now.getTime() + delayMinutes * 60_000) },
  });
}

export async function rescheduleForumDigestFromNow(userId: string, delayMinutes: number, now = new Date()) {
  const minutes = clampForumDigestDelayMinutes(delayMinutes);
  await db.user.updateMany({
    where: { id: userId, forumDigestDueAt: { not: null } },
    data: { forumDigestDueAt: new Date(now.getTime() + minutes * 60_000) },
  });
}

export async function armForumDigestForNewPost(options: { threadId: string; boardId: string; authorId: string }) {
  const [threadSubs, boardSubs, mutes] = await Promise.all([
    db.forumThreadSubscription.findMany({
      where: { threadId: options.threadId, userId: { not: options.authorId } },
      select: { userId: true },
    }),
    db.forumBoardSubscription.findMany({
      where: { boardId: options.boardId, userId: { not: options.authorId } },
      select: { userId: true },
    }),
    db.forumThreadMute.findMany({
      where: { threadId: options.threadId },
      select: { userId: true },
    }),
  ]);

  const mutedUserIds = new Set(mutes.map((row) => row.userId));
  const boardUserIds = new Set(boardSubs.map((row) => row.userId));
  const userIds = new Set<string>();

  for (const userId of boardUserIds) {
    if (!mutedUserIds.has(userId)) userIds.add(userId);
  }
  for (const row of threadSubs) {
    if (mutedUserIds.has(row.userId)) continue;
    if (!boardUserIds.has(row.userId)) userIds.add(row.userId);
  }

  for (const userId of userIds) {
    await armForumDigest(userId);
  }
}

export async function armForumDigestAfterPost(options: { threadId: string; boardId: string; authorId: string }) {
  try {
    await armForumDigestForNewPost(options);
  } catch (error) {
    console.error('Failed to arm forum digest', error);
  }
}
