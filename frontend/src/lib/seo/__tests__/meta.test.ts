import { describe, expect, it } from 'vitest';
import { absoluteUrl, formatTitle, resolveCanonical, SITE_URL } from '../meta';
import { resolveOgImage } from '../og';

describe('formatTitle', () => {
  it('appends the brand suffix to a page title', () => {
    expect(formatTitle('Writing')).toBe('Writing — DataDreamer');
  });

  it('leaves a title that already carries the brand untouched (home)', () => {
    expect(formatTitle('DataDreamer — Field notes')).toBe('DataDreamer — Field notes');
  });
});

describe('resolveCanonical', () => {
  it('uses SITE_URL + pathname, stripping query and trailing slash', () => {
    expect(resolveCanonical({ title: 't', description: 'd' }, new URL('https://x.test/blog/?page=2'))).toBe(
      `${SITE_URL}/blog`,
    );
  });

  it('keeps the root slash', () => {
    expect(resolveCanonical({ title: 't', description: 'd' }, new URL('https://x.test/'))).toBe(SITE_URL);
  });

  it('honours an explicit canonical', () => {
    expect(
      resolveCanonical({ title: 't', description: 'd', canonical: 'https://x.test/custom' }, new URL('https://x.test/a')),
    ).toBe('https://x.test/custom');
  });
});

describe('absoluteUrl', () => {
  it('passes through absolute URLs and prefixes relative ones', () => {
    expect(absoluteUrl('https://cdn.test/a.png')).toBe('https://cdn.test/a.png');
    expect(absoluteUrl('/og/x.png')).toBe(`${SITE_URL}/og/x.png`);
  });
});

describe('resolveOgImage', () => {
  it('falls back to the absolute default image', () => {
    const og = resolveOgImage({ title: 'T', description: 'd' });
    expect(og.url).toBe(`${SITE_URL}/og/og-default.png`);
    expect(og).toMatchObject({ width: 1200, height: 630, type: 'image/png' });
  });

  it('makes an explicit relative image absolute and keeps its alt', () => {
    const og = resolveOgImage({ title: 'T', description: 'd', ogImage: { url: '/og/og-blog.png', alt: 'Blog' } });
    expect(og.url).toBe(`${SITE_URL}/og/og-blog.png`);
    expect(og.alt).toBe('Blog');
  });
});
