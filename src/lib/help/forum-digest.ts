import { db } from '@/lib/db';
import { sendRawEmail } from '@/lib/email';
import { FORUM_DIGEST_CRON_BATCH, FORUM_DIGEST_SYSTEM_KEY } from '@/lib/help/forum-constants';
import { collectForumDigestThreads, formatForumDigestMergeData } from '@/lib/help/forum-digest-data';
import { armForumDigest } from '@/lib/help/forum-subscriptions';
import { accountForumAbsoluteUrl } from '@/lib/help/forum-urls';
import { renderSystemEmailTemplate, resolveGlobalSystemTemplate } from '@/lib/templates/resolve-system-template';
import { getTemplateData } from '@/lib/templates/template-data';
import { resolveTemplateSubject } from '@/lib/templates/template-subject-filename';

function isManagerUser(user: { isAdmin?: boolean | null; managerOf?: { id: string }[] }) {
  return Boolean(user.isAdmin) || (user.managerOf?.length ?? 0) > 0;
}

const globalForForumDigest = globalThis as unknown as { forumDigestJobRunning?: boolean };

function tryStartForumDigestJob() {
  if (globalForForumDigest.forumDigestJobRunning) return false;
  globalForForumDigest.forumDigestJobRunning = true;
  return true;
}

function finishForumDigestJob() {
  globalForForumDigest.forumDigestJobRunning = false;
}

async function rearmForumDigestIfNeeded(userId: string, now = new Date()) {
  const leftover = await collectForumDigestThreads(userId, now);
  if (leftover.threadCount > 0) {
    await armForumDigest(userId, now);
  }
}

async function watermarkIncludedThreads(userId: string, threadIds: string[], asOf: Date) {
  if (threadIds.length === 0) return;
  await db.$transaction(
    threadIds.map((threadId) =>
      db.forumThreadMailCursor.upsert({
        where: { userId_threadId: { userId, threadId } },
        create: { userId, threadId, lastNotifiedAt: asOf },
        update: { lastNotifiedAt: asOf },
      }),
    ),
  );
}

async function sendForumDigestEmail(options: {
  userId: string;
  email: string;
  locale: string;
  snapshot: Awaited<ReturnType<typeof collectForumDigestThreads>>;
}) {
  const template = await resolveGlobalSystemTemplate(FORUM_DIGEST_SYSTEM_KEY);
  if (!template) return false;

  const templateData = await getTemplateData(template.dataset, options.userId, options.locale);
  if (!templateData) return false;

  const digestData = formatForumDigestMergeData(options.snapshot, options.locale);
  const existingSystem =
    templateData.system && typeof templateData.system === 'object' && templateData.system !== null
      ? (templateData.system as Record<string, unknown>)
      : {};
  const mergeData = {
    ...templateData,
    ...digestData,
    system: {
      ...existingSystem,
      accountLink: accountForumAbsoluteUrl(options.locale),
    },
  };
  const html = renderSystemEmailTemplate(template.designJson, mergeData, { logoUrl: null });
  if (!html) return false;

  const subject = resolveTemplateSubject(
    template.subjectOrFilename,
    mergeData,
    `${options.snapshot.threadCount} ungelesene Forenthemen`,
  );

  const accountUrl = accountForumAbsoluteUrl(options.locale);

  await sendRawEmail(options.email, subject, html, {
    list: {
      help: accountUrl,
    },
  });
  return true;
}

export async function processDueForumDigests(now = new Date()) {
  if (!tryStartForumDigestJob()) {
    return { claimed: 0, sent: 0, skipped: true };
  }

  try {
    return await runDueForumDigests(now);
  } finally {
    finishForumDigestJob();
  }
}

async function runDueForumDigests(now: Date) {
  const due = await db.user.findMany({
    where: {
      forumDigestDueAt: { not: null, lte: now },
    },
    orderBy: { forumDigestDueAt: 'asc' },
    take: FORUM_DIGEST_CRON_BATCH,
    select: {
      id: true,
      email: true,
      language: true,
      isAdmin: true,
      managerOf: { select: { id: true } },
    },
  });

  if (due.length > 0) {
    await db.user.updateMany({
      where: { id: { in: due.map((user) => user.id) } },
      data: { forumDigestDueAt: null },
    });
  }

  let sent = 0;
  for (const user of due) {
    try {
      if (!isManagerUser(user) || !user.email?.trim()) {
        continue;
      }

      const snapshot = await collectForumDigestThreads(user.id, now);
      if (snapshot.threadCount === 0) {
        await rearmForumDigestIfNeeded(user.id);
        continue;
      }

      const ok = await sendForumDigestEmail({
        userId: user.id,
        email: user.email,
        locale: user.language || 'de',
        snapshot,
      });
      if (!ok) {
        await db.user.update({
          where: { id: user.id },
          data: { forumDigestDueAt: now },
        });
        continue;
      }

      sent += 1;
      await watermarkIncludedThreads(
        user.id,
        snapshot.threads.map((thread) => thread.id),
        snapshot.asOf,
      );
      await rearmForumDigestIfNeeded(user.id);
    } catch (error) {
      console.error('Failed to send forum digest', user.id, error);
      await db.user.update({
        where: { id: user.id },
        data: { forumDigestDueAt: now },
      });
    }
  }

  return { claimed: due.length, sent, skipped: false };
}
