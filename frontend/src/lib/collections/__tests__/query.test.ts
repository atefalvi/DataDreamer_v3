import { describe, expect, it } from 'vitest';
import {
  collectionPageRedirect,
  collectionQueryPath,
  normalizeCollectionSearch,
} from '../query';

describe('collection query helpers', () => {
  it('builds stable filtered URLs and omits page one', () => {
    expect(collectionQueryPath('/projects', { topic: 'analytics', q: 'data work' }, 1))
      .toBe('/projects?topic=analytics&q=data+work');
    expect(collectionQueryPath('/projects', { topic: null, q: undefined }, 2))
      .toBe('/projects?page=2');
  });

  it('normalizes public search input consistently', () => {
    expect(normalizeCollectionSearch('  data   governance  ')).toBe('data governance');
    expect(normalizeCollectionSearch('   ')).toBeUndefined();
    expect(normalizeCollectionSearch('x'.repeat(120))).toHaveLength(100);
  });

  it('canonicalizes redundant or malformed page queries', () => {
    const hrefForPage = (page: number) => collectionQueryPath('/guides', { level: 'advanced' }, page);
    expect(collectionPageRedirect('01', 1, 3, hrefForPage)).toEqual({
      href: '/guides?level=advanced',
      status: 301,
    });
    expect(collectionPageRedirect('1', 1, 3, hrefForPage)).toEqual({
      href: '/guides?level=advanced',
      status: 301,
    });
    expect(collectionPageRedirect('8', 8, 3, hrefForPage)).toEqual({
      href: '/guides?level=advanced&page=3',
      status: 302,
    });
    expect(collectionPageRedirect('2', 2, 3, hrefForPage)).toBeUndefined();
  });
});
