'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { searchHelpAction } from '@/actions/help';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { HelpSearchHit, HelpSearchPrimary, HelpSearchResults } from '@/types/help-search';

type HelpSearchProps = {
  primary: HelpSearchPrimary;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle || !text) return <>{text}</>;
  const regex = new RegExp(escapeRegExp(needle), 'ig');
  const nodes = [];
  let last = 0;
  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    if (start > last) {
      nodes.push(<span key={`t${start}`}>{text.slice(last, start)}</span>);
    }
    nodes.push(
      <mark key={`m${start}`} className="rounded-sm bg-primary/20 text-inherit">
        {match[0]}
      </mark>,
    );
    last = start + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<span key={`t${last}`}>{text.slice(last)}</span>);
  }
  return <>{nodes}</>;
}

export function HelpSearch({ primary }: HelpSearchProps) {
  const t = useTranslations('help.search');
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { executeAsync } = useAction(searchHelpAction);
  const executeRef = useRef(executeAsync);
  executeRef.current = executeAsync;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<HelpSearchResults | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const next = query.trim();
    if (!next) {
      setDebouncedQuery('');
      setResults(null);
      setSearching(false);
      setOpen(false);
      return;
    }
    setOpen(true);
    setSearching(true);
    const timeout = window.setTimeout(() => setDebouncedQuery(next), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;
    let cancelled = false;
    void executeRef
      .current({ query: debouncedQuery, primary })
      .then((result) => {
        if (cancelled) return;
        if (result?.serverError) {
          toast.error(result.serverError);
          setResults({ forum: [], faq: [] });
          return;
        }
        if (result?.validationErrors || !result?.data) {
          toast.error(t('searchError'));
          setResults({ forum: [], faq: [] });
          return;
        }
        setResults(result.data);
        setActiveIndex(0);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t('searchError'));
        setResults({ forum: [], faq: [] });
      })
      .finally(() => {
        if (cancelled) return;
        setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, primary, t]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const flatHits = useMemo(() => {
    const forum = results?.forum ?? [];
    const faq = results?.faq ?? [];
    return primary === 'forum' ? [...forum, ...faq] : [...faq, ...forum];
  }, [primary, results]);
  const showFlyout = open && query.trim().length > 0;
  const showEmpty = showFlyout && !searching && flatHits.length === 0;

  const goToHit = (hit: HelpSearchHit) => {
    setOpen(false);
    setQuery('');
    router.push(hit.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showFlyout) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (flatHits.length === 0) return;
      setActiveIndex((index) => Math.min(index + 1, flatHits.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (flatHits.length === 0) return;
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const hit = flatHits[activeIndex] ?? flatHits[0];
      if (hit) goToHit(hit);
    }
  };

  useEffect(() => {
    if (!showFlyout) return;
    document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, listId, showFlyout]);

  return (
    <div ref={rootRef} className="relative w-64 shrink-0">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={primary === 'forum' ? t('placeholderForum') : t('placeholderFaq')}
        className="pl-9"
        autoComplete="off"
        maxLength={200}
        role="combobox"
        aria-expanded={showFlyout}
        aria-controls={listId}
        aria-activedescendant={flatHits[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
      />
      {showFlyout ? (
        <div
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+4px)] right-0 z-50 w-[28rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          <div className="max-h-80 overflow-y-auto p-1">
            {searching && flatHits.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('searching')}</p>
            ) : showEmpty ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('noResults')}</p>
            ) : (
              flatHits.map((hit, index) => {
                const active = index === activeIndex;
                const section = hit.kind === 'forum' ? t('forum') : t('faq');
                const path = hit.meta ? `${section} / ${hit.meta}` : section;
                return (
                  <button
                    key={`${hit.kind}:${hit.id}`}
                    id={`${listId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={cn(
                      'flex w-full cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-2 text-left text-sm',
                      active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToHit(hit)}
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="truncate font-medium">
                          <HighlightedText text={hit.title} query={debouncedQuery} />
                        </span>
                        {hit.draft ? (
                          <span className="shrink-0 text-[11px] font-normal text-muted-foreground">{t('draft')}</span>
                        ) : null}
                      </span>
                      <span className="max-w-[50%] shrink-0 truncate text-right text-xs text-muted-foreground">
                        {path}
                      </span>
                    </span>
                    {hit.snippet ? (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        <HighlightedText text={hit.snippet} query={debouncedQuery} />
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
