export const FORUM_RESERVED_SLUGS = new Set(['new']);

export const FORUM_PAGE_SIZE = 20;

export const FORUM_MAX_DEPTH = 2;

export const FORUM_EMOJIS = ['👍', '❤️', '😄', '🎉', '👀', '👎'] as const;

export type ForumEmoji = (typeof FORUM_EMOJIS)[number];

export function isForumEmoji(value: string): value is ForumEmoji {
  return (FORUM_EMOJIS as readonly string[]).includes(value);
}

export const FORUM_DIGEST_SYSTEM_KEY = 'forum-unread-email';

export const FORUM_DIGEST_THREAD_CAP = 20;

export const FORUM_DIGEST_CRON_BATCH = 25;

export const FORUM_DIGEST_DEFAULT_DELAY_MINUTES = 60;

export const FORUM_DIGEST_DELAY_MINUTES = [15, 30, 60, 240, 720, 1440, 10080] as const;

export type ForumDigestDelayMinutes = (typeof FORUM_DIGEST_DELAY_MINUTES)[number];

export function isForumDigestDelayMinutes(value: number): value is ForumDigestDelayMinutes {
  return (FORUM_DIGEST_DELAY_MINUTES as readonly number[]).includes(value);
}

export function clampForumDigestDelayMinutes(value: number): ForumDigestDelayMinutes {
  return isForumDigestDelayMinutes(value) ? value : FORUM_DIGEST_DEFAULT_DELAY_MINUTES;
}
