/**
 * View-models (06 §7). Pages and components consume ONLY these — never raw Directus
 * rows. Repositories in `src/lib/repositories/` map rows → these shapes.
 */
import type { Heading } from '../lib/markdown';

export type { Heading };

export interface ImageRef {
  id: string;
  src: string;
  width?: number;
  height?: number;
  alt: string;
}

export interface TopicRef {
  name: string;
  slug: string;
}

export interface Topic extends TopicRef {
  description?: string;
}

export interface SpecialtyRef {
  name: string;
  slug: string;
  /** Token key in the viz ramp, e.g. `viz-1` (04 §3.3). */
  colorKey: string;
}

export interface AuthorRef {
  slug: string;
  name: string;
  avatar?: ImageRef;
}

export interface AuthorLink {
  label: string;
  url: string;
}

export interface FeaturedLink {
  title: string;
  url: string;
  description?: string;
}

export interface AuthorSummary extends AuthorRef {
  roleTitle: string;
  specialties: SpecialtyRef[];
  postCount: number;
  /** Reserved for v4.1 course relations; 0 until courses ship. */
  courseCount: number;
}

export interface Author extends AuthorSummary {
  bioHtml: string;
  statement?: string;
  links: AuthorLink[];
  tools: string[];
  featuredWork: FeaturedLink[];
}

export interface PostListItem {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date;
  topics: TopicRef[];
  author: AuthorRef;
  coverImage?: ImageRef;
  featured: boolean;
  seriesLabel?: string;
  postNumber?: number;
  /**
   * Populated only on the full `Post` (which fetches `content`). List queries omit
   * `content` for payload reasons (08 §8.1), so listing cards do not show read time.
   * Deviation from 06 §7 — see V4-ARC-001 handoff.
   */
  readingMinutes?: number;
}

export interface Post extends PostListItem {
  bodyHtml: string;
  headings: Heading[];
  readingMinutes: number;
}

export interface ProjectLinkRef {
  label: string;
  url: string;
}

export interface ProjectListItem {
  slug: string;
  title: string;
  summary: string;
  year: number;
  role: string;
  author: AuthorRef;
  coverImage?: ImageRef;
  tags: string[];
  links: ProjectLinkRef[];
  featured: boolean;
}

export interface Project extends ProjectListItem {
  bodyHtml: string;
}

export interface PostListPage {
  items: PostListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}
