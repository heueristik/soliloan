'use server';

import { findHelpSearch } from '@/lib/help/help-search';
import { helpSearchSchema } from '@/lib/schemas/help-search';
import { managerAction } from '@/lib/utils/safe-action';

export const searchHelpAction = managerAction.inputSchema(helpSearchSchema).action(async ({ parsedInput, ctx }) => {
  return findHelpSearch({
    query: parsedInput.query,
    primary: parsedInput.primary,
    includeUnpublished: Boolean(ctx.session.user.isAdmin),
  });
});
