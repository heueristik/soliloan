import { getAppBaseUrl } from '@/lib/templates/system-merge-links';

const DEFAULT_LOCALE = 'de';

function localePrefix(locale?: string | null) {
  const value = locale?.trim() || DEFAULT_LOCALE;
  return value.split('-')[0] || DEFAULT_LOCALE;
}

export function forumBoardPath(boardSlug: string) {
  return `/help/forum/${boardSlug}`;
}

export function forumThreadPath(boardSlug: string, threadId: string) {
  return `/help/forum/${boardSlug}/${threadId}`;
}

export function forumHomePath() {
  return '/help/forum';
}

export function accountForumPath() {
  return '/account#forum';
}

export function absoluteAppUrl(path: string, locale?: string | null) {
  const base = getAppBaseUrl();
  const prefix = localePrefix(locale);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}/${prefix}${normalized}`;
}

export function forumThreadAbsoluteUrl(boardSlug: string, threadId: string, locale?: string | null) {
  return absoluteAppUrl(forumThreadPath(boardSlug, threadId), locale);
}

export function forumBoardAbsoluteUrl(boardSlug: string, locale?: string | null) {
  return absoluteAppUrl(forumBoardPath(boardSlug), locale);
}

export function forumHomeAbsoluteUrl(locale?: string | null) {
  return absoluteAppUrl(forumHomePath(), locale);
}

export function accountForumAbsoluteUrl(locale?: string | null) {
  return absoluteAppUrl('/account', locale);
}
