export const COLLECTION_PAGE_SIZE = 9;

export interface CollectionPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Canonical positive integer parsing for path segments and query parameters. */
export function parseCollectionPage(value: string | null | undefined): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : undefined;
}

/** Shared archive pagination contract for the Projects and Guides catalogues. */
export function paginateCollection<T>(
  items: T[],
  requestedPage: number,
  pageSize = COLLECTION_PAGE_SIZE,
): CollectionPage<T> {
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalPages,
  };
}
