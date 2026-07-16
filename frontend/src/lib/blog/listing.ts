import { authorsRepo, postsRepo, topicsRepo } from '../repositories';
import type { AuthorSummary, PostListItem, PostListPage, Topic, TopicRef } from '../../types/content';

export const BLOG_PAGE_SIZE = 12;

export interface BlogListing {
  activeAuthor?: string;
  activeTopic?: Topic;
  authors: AuthorSummary[];
  featured: PostListItem | null;
  page: PostListPage;
  posts: PostListItem[];
  topics: Array<{ topic: TopicRef; count: number }>;
}

export interface BlogListingInput {
  author?: string;
  page?: number;
  topic?: string;
}

export function emptyBlogListing(input: BlogListingInput = {}): BlogListing {
  const page = Math.max(1, input.page ?? 1);
  return {
    activeAuthor: input.author,
    authors: [],
    featured: null,
    page: { items: [], page, pageSize: BLOG_PAGE_SIZE, hasMore: false },
    posts: [],
    topics: [],
  };
}

export async function loadBlogListing(input: BlogListingInput = {}): Promise<BlogListing> {
  const page = Math.max(1, input.page ?? 1);
  const [postPage, topics, authors, featured, activeTopic] = await Promise.all([
    postsRepo.list({
      author: input.author,
      page,
      pageSize: BLOG_PAGE_SIZE,
      topic: input.topic,
    }),
    topicsRepo.withPostCounts(),
    authorsRepo.allWithCounts(),
    input.topic || input.author || page > 1 ? Promise.resolve(null) : postsRepo.featuredOrLatest(),
    input.topic ? topicsRepo.bySlug(input.topic) : Promise.resolve(null),
  ]);

  const featuredSlug = featured?.slug;
  const posts = postPage.items.filter((post) => post.slug !== featuredSlug);

  return {
    activeAuthor: input.author,
    activeTopic: activeTopic ?? undefined,
    authors: authors.filter((author) => author.postCount > 0),
    featured,
    page: postPage,
    posts,
    topics,
  };
}

export function blogPath(page = 1): string {
  return page <= 1 ? '/blog' : `/blog/${page}`;
}

export function topicPath(slug: string, page = 1): string {
  const base = `/blog/topic/${slug}`;
  return page <= 1 ? base : `${base}/${page}`;
}

/** Canonical positive integer parsing for route segments (rejects 0, 01, decimals). */
export function parsePaginationPage(value: string | undefined): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : undefined;
}

export function listingPagePath(topic: string | undefined, page: number): string {
  return topic ? topicPath(topic, page) : blogPath(page);
}

export function withAuthor(path: string, author?: string): string {
  if (!author) return path;
  const params = new URLSearchParams({ author });
  return `${path}?${params.toString()}`;
}
