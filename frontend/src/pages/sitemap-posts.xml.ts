import type { APIContext } from 'astro';
import { postsRepo } from '../lib/repositories';
import { postsSitemapXml } from '../lib/seo/sitemap';

export async function GET(_context: APIContext) {
  let xml = postsSitemapXml([]);
  try {
    const posts = await postsRepo.sitemap();
    xml = postsSitemapXml(posts);
  } catch (error) {
    console.error('[sitemap-posts] posts unavailable:', error instanceof Error ? error.message : error);
  }

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
