'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  /** Short name shown in the table header. */
  title: string;
  /** Long name shown in the column menu. Defaults to `title`. */
  longTitle?: string;
  /** Optional explanation shown under the long name. */
  description?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  longTitle,
  description,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const t = useTranslations('dataTable.columnMenu');
  const [open, setOpen] = useState(false);
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  const resolvedLongTitle = longTitle ?? title;

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {open ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            aria-label={t('moveLeft')}
            className="pointer-events-none absolute -left-3 top-1/2 z-30 size-6 -translate-x-full -translate-y-1/2 rounded-full border-border/60 bg-background/90 text-muted-foreground opacity-70 shadow-none"
          >
            <ArrowLeft className="size-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled
            aria-label={t('moveRight')}
            className="pointer-events-none absolute -right-3 top-1/2 z-30 size-6 translate-x-full -translate-y-1/2 rounded-full border-border/60 bg-background/90 text-muted-foreground opacity-70 shadow-none"
          >
            <ArrowRight className="size-3" />
          </Button>
        </>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-expanded={open}
            className={cn('h-8 gap-1 px-2 data-[state=open]:bg-accent', open && 'bg-accent text-accent-foreground')}
          >
            <span className="truncate">{title}</span>
            {sorted === 'asc' ? (
              <ArrowUp className="size-3.5 shrink-0 opacity-70" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="size-3.5 shrink-0 opacity-70" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 opacity-40" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={8} className="w-80 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="text-sm font-semibold leading-snug">{resolvedLongTitle}</div>
              {description ? <p className="text-xs text-muted-foreground leading-relaxed">{description}</p> : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              aria-label={t('moreOptions')}
              className="size-8 shrink-0 text-muted-foreground"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>

          {canSort ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">{t('sort')}</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={sorted === 'desc' ? 'secondary' : 'outline'}
                  size="icon"
                  aria-label={t('sortDesc')}
                  className="size-8"
                  onClick={() => column.toggleSorting(true)}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={sorted === 'asc' ? 'secondary' : 'outline'}
                  size="icon"
                  aria-label={t('sortAsc')}
                  className="size-8"
                  onClick={() => column.toggleSorting(false)}
                >
                  <ArrowUp className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
