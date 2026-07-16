import type { APIContext } from 'astro';
import { authorsRepo, guidesRepo, projectsRepo, topicsRepo } from '../lib/repositories';
import { contentSitemapXml, type ContentSitemapEntry } from '../lib/seo/sitemap';

type SettledItems<T> = PromiseSettledResult<T[]>;

function appendSettled<T>(
  entries: ContentSitemapEntry[],
  result: SettledItems<T>,
  label: string,
  map: (item: T) => ContentSitemapEntry,
): void {
  if (result.status === 'fulfilled') {
    entries.push(...result.value.map(map));
    return;
  }
  console.error(`[sitemap-content] ${label} unavailable:`, result.reason);
}

export async function GET(_context: APIContext) {
  const results = await Promise.allSettled([
    projectsRepo.sitemap(),
    guidesRepo.sitemap(),
    authorsRepo.sitemap(),
    topicsRepo.sitemap(),
  ]);

  const entries: ContentSitemapEntry[] = [];
  appendSettled(entries, results[0], 'projects', (item) => ({
    path: `/projects/${item.slug}`,
    lastmod: item.updatedAt,
  }));
  appendSettled(entries, results[1], 'guides', (item) => ({
    path: `/guides/${item.slug}`,
    lastmod: item.updatedAt,
  }));
  appendSettled(entries, results[2], 'authors', (item) => ({
    path: `/dream-team/${item.slug}`,
    lastmod: item.updatedAt,
  }));
  appendSettled(entries, results[3], 'topics', (item) => ({
    path: `/topics/${item.slug}`,
    lastmod: item.updatedAt,
  }));

  return new Response(contentSitemapXml(entries), {
    headers: {
      'Cache-Control': 'public, s-maxage=3600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
