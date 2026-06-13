import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeEach, describe, expect, it } from 'vitest';
import SeoHead from '../SeoHead.astro';

let container: AstroContainer;

beforeEach(async () => {
  container = await AstroContainer.create();
});

function render(props: Record<string, unknown>, url = 'https://data-dreamer.net/blog?page=2') {
  return container.renderToString(SeoHead, { props, request: new Request(url) });
}

describe('SeoHead', () => {
  it('emits the expected head metadata (snapshot)', async () => {
    const html = await render({
      title: 'Writing',
      description: 'Practical writing on data systems.',
      ogType: 'website',
    });
    expect(html).toMatchSnapshot();
  });

  it('formats the title and strips the canonical query string', async () => {
    const html = await render({ title: 'Writing', description: 'd', ogType: 'website' });
    expect(html).toContain('<title>Writing — DataDreamer</title>');
    expect(html).toContain('href="https://data-dreamer.net/blog"');
    expect(html).not.toContain('page=2');
  });

  it('defaults to the fallback OG image and index,follow robots', async () => {
    const html = await render({ title: 'T', description: 'd' });
    expect(html).toContain('property="og:image" content="https://data-dreamer.net/og/og-default.png"');
    expect(html).toContain('content="index, follow"');
  });

  it('emits noindex when requested', async () => {
    const html = await render({ title: 'Secret', description: 'd', noindex: true });
    expect(html).toContain('content="noindex, nofollow"');
  });

  it('emits article tags and JSON-LD for articles', async () => {
    const html = await render({
      title: 'A post',
      description: 'd',
      ogType: 'article',
      article: { publishedTime: '2026-05-12T09:00:00Z', author: 'Atef Alvi', tags: ['data'] },
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'A post' }],
    });
    expect(html).toContain('property="article:published_time" content="2026-05-12T09:00:00Z"');
    expect(html).toContain('property="article:author" content="Atef Alvi"');
    expect(html).toContain('property="article:tag" content="data"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"BlogPosting"');
  });
});
