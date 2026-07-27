import { beforeEach, describe, expect, it, vi } from 'vitest';

const repos = vi.hoisted(() => ({
  authorsAllWithCounts: vi.fn(),
  postsFeatured: vi.fn(),
  postsList: vi.fn(),
  topicBySlug: vi.fn(),
  topicsWithPostCounts: vi.fn(),
}));

vi.mock('../../repositories', () => ({
  authorsRepo: { allWithCounts: repos.authorsAllWithCounts },
  postsRepo: { featured: repos.postsFeatured, list: repos.postsList },
  topicsRepo: { bySlug: repos.topicBySlug, withPostCounts: repos.topicsWithPostCounts },
}));

import { BLOG_PAGE_SIZE, loadBlogListing } from '../listing';

const featured = { slug: 'featured-post', title: 'Featured post' };

beforeEach(() => {
  vi.clearAllMocks();
  repos.authorsAllWithCounts.mockResolvedValue([]);
  repos.postsFeatured.mockResolvedValue(featured);
  repos.postsList.mockResolvedValue({
    items: Array.from({ length: 9 }, (_, index) => ({ slug: 'post-' + (index + 1) })),
    page: 1,
    pageSize: 9,
    hasMore: true,
  });
  repos.topicBySlug.mockResolvedValue(null);
  repos.topicsWithPostCounts.mockResolvedValue([]);
});

describe('blog listing pagination', () => {
  it('keeps the featured hero separate from a full nine-card archive grid', async () => {
    const listing = await loadBlogListing({ page: 1 });

    expect(BLOG_PAGE_SIZE).toBe(9);
    expect(listing.featured?.slug).toBe('featured-post');
    expect(listing.posts).toHaveLength(9);
    expect(repos.postsList).toHaveBeenCalledWith(expect.objectContaining({
      excludeSlug: 'featured-post',
      page: 1,
      pageSize: 9,
    }));
  });

  it('does not repeat the featured hero on later pages', async () => {
    const listing = await loadBlogListing({ page: 2 });

    expect(listing.featured).toBeNull();
    expect(repos.postsList).toHaveBeenCalledWith(expect.objectContaining({
      excludeSlug: 'featured-post',
      page: 2,
      pageSize: 9,
    }));
  });

  it('uses nine archive items for filtered listings without reserving a hero slot', async () => {
    await loadBlogListing({ topic: 'analytics', page: 1 });

    expect(repos.postsFeatured).not.toHaveBeenCalled();
    expect(repos.postsList).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'analytics',
      pageSize: 9,
    }));
  });
});
