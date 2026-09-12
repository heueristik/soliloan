import { z } from 'zod';

export const helpSearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  primary: z.enum(['forum', 'faq']),
});
