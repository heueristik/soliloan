import { FORUM_EMOJIS } from '@/lib/help/forum-constants';
import type { ForumAuthor, ForumPostNode, ForumPostReactionSummary, ForumThreadRecord } from '@/types/forum';

const OPTIMISTIC_POST_PREFIX = 'optimistic:';

export function isOptimisticForumPostId(id: string) {
  return id.startsWith(OPTIMISTIC_POST_PREFIX);
}

export function mapForumThreadPosts(
  thread: ForumThreadRecord,
  fn: (post: ForumPostNode) => ForumPostNode,
): ForumThreadRecord {
  const walk = (post: ForumPostNode): ForumPostNode => fn({ ...post, replies: post.replies.map(walk) });
  return {
    ...thread,
    originalPost: thread.originalPost ? walk(thread.originalPost) : null,
    firstLevelPosts: thread.firstLevelPosts.map(walk),
  };
}

export function updateForumPostById(
  thread: ForumThreadRecord,
  postId: string,
  updater: (post: ForumPostNode) => ForumPostNode,
): ForumThreadRecord {
  return mapForumThreadPosts(thread, (post) => (post.id === postId ? updater(post) : post));
}

export function toggleForumReactions(
  reactions: ForumPostReactionSummary[],
  emoji: string,
  userName: string,
): ForumPostReactionSummary[] {
  const byEmoji = new Map(reactions.map((item) => [item.emoji, { ...item, names: [...item.names] }]));
  for (const key of FORUM_EMOJIS) {
    if (!byEmoji.has(key)) {
      byEmoji.set(key, { emoji: key, count: 0, reacted: false, names: [] });
    }
  }

  const current = FORUM_EMOJIS.find((key) => byEmoji.get(key)?.reacted);

  const removeUser = (item: ForumPostReactionSummary): ForumPostReactionSummary => {
    const names = [...item.names];
    const index = names.lastIndexOf(userName);
    if (index >= 0) names.splice(index, 1);
    return { ...item, count: Math.max(0, item.count - 1), reacted: false, names };
  };

  const addUser = (item: ForumPostReactionSummary): ForumPostReactionSummary => ({
    ...item,
    count: item.count + 1,
    reacted: true,
    names: [...item.names, userName],
  });

  if (current === emoji) {
    const selected = byEmoji.get(emoji);
    if (selected) byEmoji.set(emoji, removeUser(selected));
  } else {
    const previous = current ? byEmoji.get(current) : undefined;
    if (current && previous) byEmoji.set(current, removeUser(previous));
    const selected = byEmoji.get(emoji);
    if (selected) byEmoji.set(emoji, addUser(selected));
  }

  return FORUM_EMOJIS.map((key) => byEmoji.get(key) ?? { emoji: key, count: 0, reacted: false, names: [] });
}

function emptyReactions(): ForumPostReactionSummary[] {
  return FORUM_EMOJIS.map((emoji) => ({ emoji, count: 0, reacted: false, names: [] }));
}

export function createOptimisticForumPost(options: {
  author: ForumAuthor;
  body: unknown;
  parentId: string;
}): ForumPostNode {
  return {
    id: `${OPTIMISTIC_POST_PREFIX}${crypto.randomUUID()}`,
    author: options.author,
    body: options.body,
    createdAt: new Date(),
    editedAt: null,
    parentId: options.parentId,
    hasReplies: false,
    canEdit: false,
    canDelete: false,
    reactions: emptyReactions(),
    replies: [],
  };
}

function withReplyChild(post: ForumPostNode, reply: ForumPostNode): ForumPostNode {
  return {
    ...post,
    hasReplies: true,
    canDelete: false,
    replies: [...post.replies, reply],
  };
}

export function insertForumReply(
  thread: ForumThreadRecord,
  parent: ForumPostNode,
  reply: ForumPostNode,
): ForumThreadRecord {
  const originalId = thread.originalPost?.id;
  if (!parent.parentId) {
    return {
      ...thread,
      originalPost: thread.originalPost ? { ...thread.originalPost, hasReplies: true, canDelete: false } : null,
      firstLevelPosts: [...thread.firstLevelPosts, reply],
      firstLevelTotal: thread.firstLevelTotal + 1,
    };
  }

  if (parent.parentId === originalId) {
    return {
      ...thread,
      firstLevelPosts: thread.firstLevelPosts.map((post) =>
        post.id === parent.id ? withReplyChild(post, reply) : post,
      ),
    };
  }

  return {
    ...thread,
    firstLevelPosts: thread.firstLevelPosts.map((post) =>
      post.id === parent.parentId ? withReplyChild(post, { ...reply, parentId: post.id }) : post,
    ),
  };
}

export type ForumOptimisticAction =
  | { type: 'react'; postId: string; emoji: string; userName: string }
  | { type: 'edit'; postId: string; body: unknown }
  | { type: 'reply'; parent: ForumPostNode; reply: ForumPostNode };

export function applyForumOptimistic(thread: ForumThreadRecord, action: ForumOptimisticAction): ForumThreadRecord {
  if (action.type === 'react') {
    return updateForumPostById(thread, action.postId, (post) => ({
      ...post,
      reactions: toggleForumReactions(post.reactions, action.emoji, action.userName),
    }));
  }
  if (action.type === 'edit') {
    return updateForumPostById(thread, action.postId, (post) => ({
      ...post,
      body: action.body,
      editedAt: new Date(),
    }));
  }
  return insertForumReply(thread, action.parent, action.reply);
}
