import { describe, expect, it } from 'vitest';
import { COLLECTION_PAGE_SIZE, paginateCollection, parseCollectionPage } from '../pagination';

describe('collection pagination', () => {
  it('uses a shared nine-item page size that forms a 3 × 3 desktop grid', () => {
    expect(COLLECTION_PAGE_SIZE).toBe(9);
    expect(paginateCollection(Array.from({ length: 9 }), 1)).toMatchObject({
      page: 1,
      pageSize: 9,
      totalPages: 1,
    });
  });

  it('returns every item exactly once across page boundaries', () => {
    const items = Array.from({ length: 20 }, (_, index) => index + 1);
    const pages = [1, 2, 3].map((page) => paginateCollection(items, page));

    expect(pages.map((result) => result.items.length)).toEqual([9, 9, 2]);
    expect(pages.flatMap((result) => result.items)).toEqual(items);
    expect(pages.every((result) => result.totalPages === 3)).toBe(true);
  });

  it('normalizes invalid page input without creating an empty first page', () => {
    expect(paginateCollection(['one'], 0)).toMatchObject({
      items: ['one'],
      page: 1,
      totalPages: 1,
    });
  });

  it('accepts only canonical positive page numbers', () => {
    expect(parseCollectionPage('12')).toBe(12);
    expect(parseCollectionPage('0')).toBeUndefined();
    expect(parseCollectionPage('01')).toBeUndefined();
    expect(parseCollectionPage('1.5')).toBeUndefined();
    expect(parseCollectionPage(null)).toBeUndefined();
  });
});
