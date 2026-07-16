import { describe, expect, it } from 'vitest';
import {
  blogPath,
  listingPagePath,
  parsePaginationPage,
  topicPath,
  withAuthor,
} from '../listing';

describe('writing pagination paths', () => {
  it('builds three canonical main Writing pages without renaming /blog', () => {
    expect([1, 2, 3].map(blogPath)).toEqual(['/blog', '/blog/2', '/blog/3']);
  });

  it('builds three canonical topic pages', () => {
    expect([1, 2, 3].map((page) => topicPath('data-engineering', page))).toEqual([
      '/blog/topic/data-engineering',
      '/blog/topic/data-engineering/2',
      '/blog/topic/data-engineering/3',
    ]);
  });

  it('selects main or topic pagination and preserves author filters', () => {
    expect(listingPagePath(undefined, 2)).toBe('/blog/2');
    expect(listingPagePath('analytics', 2)).toBe('/blog/topic/analytics/2');
    expect(withAuthor('/blog/topic/analytics/2', 'maria-khan')).toBe(
      '/blog/topic/analytics/2?author=maria-khan',
    );
  });

  it.each([
    ['1', 1],
    ['2', 2],
    ['37', 37],
  ])('parses canonical page segment %s', (value, expected) => {
    expect(parsePaginationPage(value)).toBe(expected);
  });

  it.each([undefined, '', '0', '01', '-2', '2.5', 'page'])('rejects invalid page %s', (value) => {
    expect(parsePaginationPage(value)).toBeUndefined();
  });
});
