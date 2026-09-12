import { z } from 'zod';

import { EMPTY_FAQ_DOC } from '@/lib/help/faq-constants';
import { FORUM_EMOJIS } from '@/lib/help/forum-constants';
import { slugify } from '@/lib/help/slugify';

import { richTextBodyActionSchema } from './rich-text';

const requiredSlug = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return '';
    return slugify(value);
  },
  z
    .string()
    .min(1, { message: 'validation.common.required' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'validation.help.slugInvalid' }),
);

const requiredTitle = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
  },
  z.string().min(1, { message: 'validation.common.required' }).max(200, { message: 'validation.common.tooLong' }),
);

export const forumBoardFormSchema = z.object({
  name: requiredTitle,
  slug: requiredSlug,
  description: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return '';
      return value.trim();
    },
    z.string().max(500, { message: 'validation.common.tooLong' }),
  ),
  moderatorIds: z.array(z.string()).default([]),
});

export type ForumBoardFormData = z.infer<typeof forumBoardFormSchema>;

export const forumBoardReorderSchema = z.object({
  boardIds: z.array(z.string()),
});

export const forumBoardIdSchema = z.object({
  id: z.string().min(1),
});

export const forumThreadFormSchema = z.object({
  title: requiredTitle,
  body: z.unknown().default(EMPTY_FAQ_DOC),
  watchThread: z.boolean(),
});

export type ForumThreadFormData = z.infer<typeof forumThreadFormSchema>;

export const forumThreadCreateSchema = forumThreadFormSchema.omit({ body: true }).extend({
  boardId: z.string().min(1),
  body: richTextBodyActionSchema,
  watchThread: z.boolean().optional().default(true),
});

export const forumThreadRenameSchema = z.object({
  id: z.string().min(1),
  title: requiredTitle,
});

export const forumThreadMoveSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().min(1),
});

export const forumThreadFlagsSchema = z.object({
  id: z.string().min(1),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
});

export const forumPostFormSchema = z.object({
  threadId: z.string().min(1),
  body: z.unknown().default(EMPTY_FAQ_DOC),
  parentId: z.string().min(1),
  watchThread: z.boolean().optional(),
});

export type ForumPostFormData = z.infer<typeof forumPostFormSchema>;

export const forumPostCreateSchema = forumPostFormSchema.omit({ body: true }).extend({
  body: richTextBodyActionSchema,
});

export const forumPostUpdateSchema = z.object({
  id: z.string().min(1),
  body: richTextBodyActionSchema,
});

export const forumReactionSchema = z.object({
  postId: z.string().min(1),
  emoji: z.enum(FORUM_EMOJIS),
});

export const forumWatchTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('thread'), id: z.string().min(1) }),
  z.object({ kind: z.literal('board'), id: z.string().min(1) }),
  z.object({ kind: z.literal('mute'), id: z.string().min(1) }),
]);
