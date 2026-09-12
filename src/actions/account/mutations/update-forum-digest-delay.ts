'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { rescheduleForumDigestFromNow } from '@/lib/help/forum-subscriptions';
import { updateForumDigestDelaySchema } from '@/lib/schemas/account';
import { managerAction } from '@/lib/utils/safe-action';

export const updateForumDigestDelayAction = managerAction
  .inputSchema(updateForumDigestDelaySchema)
  .action(async ({ parsedInput: { forumDigestDelayMinutes }, ctx: { session } }) => {
    const userId = session.user.id;
    if (!userId) {
      throw new Error('error.unauthorized');
    }
    await db.user.update({
      where: { id: userId },
      data: { forumDigestDelayMinutes },
    });
    await rescheduleForumDigestFromNow(userId, forumDigestDelayMinutes);
    revalidatePath('/account');
    revalidatePath('/help/forum');
    return { success: true };
  });
