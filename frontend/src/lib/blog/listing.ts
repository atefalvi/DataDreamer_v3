import { authorsRepo, postsRepo, topicsRepo } from '../repositories';
import type { AuthorSummary, PostListItem, PostListPage, Topic, TopicRef } from '../../types/content';
import { COLLECTION_PAGE_SIZE, parseCollectionPage } from '../collections/pagination';
import { normalizeCollectionSearch } from '../collections/query';

export const BLOG_PAGE_SIZE = COLLECTION_PAGE_SIZE;

export interface BlogListing {
  activeAuthor?: string;
  activeSearch?: string;
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
  search?: string;
  topic?: string;
}

export function emptyBlogListing(input: BlogListingInput = {}): BlogListing {
  const page = Math.max(1, input.page ?? 1);
  return {
    activeAuthor: input.author,
    activeSearch: normalizeSearchQuery(input.search),
    authors: [],
    featured: null,
    page: { items: [], page, pageSize: BLOG_PAGE_SIZE, hasMore: false },
    posts: [],
    topics: [],
  };
}

export async function loadBlogListing(input: BlogListingInput = {}): Promise<BlogListing> {
  const page = Math.max(1, input.page ?? 1);
  const search = normalizeSearchQuery(input.search);
  const isUnfiltered = !input.topic && !input.author && !search;
  const [topics, authors, featuredItem, activeTopic] = await Promise.all([
    topicsRepo.withPostCounts(),
    authorsRepo.allWithCounts(),
    isUnfiltered ? postsRepo.featured() : Promise.resolve(null),
    input.topic ? topicsRepo.bySlug(input.topic) : Promise.resolve(null),
  ]);

  const postPage = await postsRepo.list({
    author: input.author,
    excludeSlug: featuredItem?.slug,
    page,
    pageSize: BLOG_PAGE_SIZE,
    search,
    topic: input.topic,
  });
  const featured = page === 1 ? featuredItem : null;

  return {
    activeAuthor: input.author,
    activeSearch: search,
    activeTopic: activeTopic ?? undefined,
    authors: authors.filter((author) => author.postCount > 0),
    featured,
    page: { ...postPage, pageSize: BLOG_PAGE_SIZE },
    posts: postPage.items,
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
  return parseCollectionPage(value);
}

export function listingPagePath(topic: string | undefined, page: number): string {
  return topic ? topicPath(topic, page) : blogPath(page);
}

export interface ListingFilters {
  author?: string;
  search?: string;
}

export function withListingFilters(path: string, filters: ListingFilters): string {
  const params = new URLSearchParams();
  if (filters.author) params.set('author', filters.author);
  const search = normalizeSearchQuery(filters.search);
  if (search) params.set('q', search);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Trim, collapse whitespace, and cap public search input before sending it to Directus. */
export function normalizeSearchQuery(value: string | undefined): string | undefined {
  return normalizeCollectionSearch(value);
}
