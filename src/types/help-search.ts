export type HelpSearchPrimary = 'forum' | 'faq';

export type HelpSearchHit = {
  id: string;
  kind: HelpSearchPrimary;
  title: string;
  href: string;
  meta: string;
  snippet: string;
  draft?: boolean;
};

export type HelpSearchResults = {
  forum: HelpSearchHit[];
  faq: HelpSearchHit[];
};
