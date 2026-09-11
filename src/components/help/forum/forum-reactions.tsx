'use client';

import { Smile } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FORUM_EMOJIS, type ForumEmoji } from '@/lib/help/forum-constants';
import { cn } from '@/lib/utils';
import type { ForumPostReactionSummary } from '@/types/forum';

type ForumReactionsProps = {
  reactions: ForumPostReactionSummary[];
  onToggle: (emoji: ForumEmoji) => void;
};

export function ForumReactions({ reactions, onToggle }: ForumReactionsProps) {
  const t = useTranslations('help.forumPage');
  const byEmoji = new Map(reactions.map((item) => [item.emoji, item]));
  const used = FORUM_EMOJIS.filter((emoji) => (byEmoji.get(emoji)?.count ?? 0) > 0);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <TooltipProvider delayDuration={300}>
        {used.map((emoji) => {
          const item = byEmoji.get(emoji);
          const count = item?.count ?? 0;
          const reacted = item?.reacted ?? false;
          const names = item?.names ?? [];
          return (
            <Tooltip key={emoji}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 bg-transparent px-2 text-sm hover:bg-transparent',
                    !reacted && 'text-muted-foreground',
                  )}
                  onClick={() => onToggle(emoji)}
                >
                  <span aria-hidden>{emoji}</span>
                  <span className="ml-1 tabular-nums">{count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{names.join(', ')}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
      <DropdownMenu>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <Smile className="h-4 w-4" />
                  <span className="sr-only">{t('react')}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>{t('react')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="flex min-w-0 flex-row gap-0.5 p-1">
          {FORUM_EMOJIS.map((emoji) => (
            <DropdownMenuItem
              key={emoji}
              className="cursor-pointer justify-center bg-transparent px-2 focus:bg-accent"
              onSelect={() => onToggle(emoji)}
            >
              <span aria-hidden className="text-base">
                {emoji}
              </span>
              <span className="sr-only">{emoji}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
