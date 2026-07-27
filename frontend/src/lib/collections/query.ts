export type CollectionFilters = Record<string, string | null | undefined>;

/** Trim, collapse whitespace, and cap public search input before filtering or querying. */
export function normalizeCollectionSearch(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ').slice(0, 100);
  return normalized || undefined;
}

/** Build a canonical query-based collection URL, omitting empty filters and page one. */
export function collectionQueryPath(
  basePath: string,
  filters: CollectionFilters,
  page = 1,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export interface CollectionRedirect {
  href: string;
  status: 301 | 302;
}

/** Resolve malformed, redundant page-one, and out-of-range collection URLs. */
export function collectionPageRedirect(
  rawPage: string | null,
  page: number,
  totalPages: number,
  hrefForPage: (page: number) => string,
): CollectionRedirect | undefined {
  if (rawPage && (rawPage !== String(page) || page === 1)) {
    return { href: hrefForPage(1), status: 301 };
  }

  if (page > totalPages) {
    return { href: hrefForPage(totalPages), status: 302 };
  }

  return undefined;
}
