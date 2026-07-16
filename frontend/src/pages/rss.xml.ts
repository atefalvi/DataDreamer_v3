/**
 * V4-BLOG-003 — RSS feed (10 §4). Latest 20 published posts, excerpt-only (not full
 * content), with author and topics as categories. Built with @astrojs/rss for valid,
 * correctly-escaped output. Degrades to an empty (but valid) feed if the CMS is down.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { postsRepo } from '../lib/repositories';
import { SITE_URL, SITE_NAME } from '../lib/seo/meta';
import type { PostListItem } from '../types/content';

export async function GET(context: APIContext) {
  let items: PostListItem[] = [];
  try {
    const page = await postsRepo.list({ pageSize: 20 });
    items = page.items;
  } catch (error) {
    console.error('[rss] posts unavailable:', error instanceof Error ? error.message : error);
  }

  return rss({
    title: `${SITE_NAME} — Field notes`,
    description:
      'Structured reflections and practical lessons from learning, building, and explaining real-world data systems.',
    site: context.site ?? SITE_URL,
    items: items.map((post) => ({
      title: post.title,
      link: `/blog/${post.slug}`,
      pubDate: post.publishedAt,
      description: post.excerpt,
      author: post.author?.name,
      categories: post.topics.map((topic) => topic.name),
    })),
    customData: '<language>en-us</language>',
  });
}
