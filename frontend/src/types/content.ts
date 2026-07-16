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
  /**
   * Whether this author has a public /dream-team profile page (v4.2 account model).
   * Bylines link to the profile only when true; blog-only Contributors render as
   * plain text. Defaults to true when the query didn't select the field.
   */
  dreamTeam: boolean;
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
  /** Reserved for v4.1 guide relations; 0 until guides ship. */
  guideCount: number;
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
  /** Directus-managed edit timestamp, used for article dateModified and sitemap lastmod. */
  updatedAt?: Date;
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
  /** From the markdown pipeline: the body contains an :::imagegrid (mount the lightbox). */
  hasImageGrid: boolean;
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
  /** Directus-managed edit timestamp, used for sitemap lastmod. */
  updatedAt?: Date;
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

/* ── Field Guides (v4.1) — login-gated curated learning paths (01 §1a) ──────────── */

export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

/** The flexible resource kinds inside a guide section (08 §4.3). */
export type GuideItemType =
  | 'youtube'
  | 'external_url'
  | 'pdf'
  | 'uploaded_file'
  | 'notebooklm'
  | 'github_repo'
  | 'code_sample'
  | 'cheat_sheet'
  | 'personal_note'
  | 'exercise'
  | 'docs_page';

/**
 * A single curated resource. Gated fields (`url`, `asset`, `bodyHtml`, and the curator
 * annotations) are present only on the authenticated reader view; on the public preview
 * they are absent and `locked` is true (08 §5, report "public preview, gated reader").
 */
export interface GuideItem {
  id: string;
  type: GuideItemType;
  title: string;
  description?: string;
  /** Per-item time estimate, minutes. */
  estimatedMinutes?: number;
  difficulty?: GuideDifficulty;
  /** True on the public preview (gated content withheld). */
  locked: boolean;
  // ── reader-only (omitted when locked) ──
  url?: string;
  /** For `pdf` / `uploaded_file`. */
  asset?: ImageRef;
  /** Rendered markdown for note/cheat-sheet/code/exercise types. */
  bodyHtml?: string;
  /** Curator annotations — the value of the guide. */
  whyIncludedHtml?: string;
  focusOnHtml?: string;
  notesHtml?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  descriptionHtml?: string;
  items: GuideItem[];
}

export interface GuideListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: GuideDifficulty;
  coverImage?: ImageRef;
  /** Curator-entered total, minutes (08 §4.1). */
  estimatedMinutes?: number;
  itemCount: number;
  sectionCount: number;
  featured: boolean;
  /** Primary curator (card byline). */
  curator: AuthorRef;
  topics: TopicRef[];
  /** Directus-managed edit timestamp, used for sitemap lastmod. */
  updatedAt?: Date;
}

export interface Guide extends GuideListItem {
  whyThisPathHtml: string;
  expectedOutcomeHtml?: string;
  recommendedAudience?: string;
  /** Primary curator + additional contributors. */
  curators: AuthorRef[];
  specialties: SpecialtyRef[];
  sections: GuideSection[];
  /** Whether this view is the gated reader (true) or the public preview (false). */
  unlocked: boolean;
}

export interface GuideListPage {
  items: GuideListItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type GuideProgressStatus = 'not-started' | 'in-progress' | 'completed';

/** Raw per-user+guide state from the `guide_progress` collection (08 §4.5). */
export interface StoredGuideProgress {
  completedItemIds: string[];
  lastItemId?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/** A row on the learner's account "My guides" list (08 §4.5 joined to the guide). */
export interface AccountGuideProgress {
  slug: string;
  title: string;
  coverImage?: ImageRef;
  percent: number;
  status: GuideProgressStatus;
}

/** Progress derived from a guide's items + stored state (pure; 09 §10). */
export interface DerivedGuideProgress {
  status: GuideProgressStatus;
  /** 0–100, rounded. */
  percent: number;
  completedCount: number;
  remainingCount: number;
  totalCount: number;
  /** Sum of `estimatedMinutes` over incomplete items. */
  estMinutesRemaining: number;
  /** Where "Resume" should jump — first incomplete item, or last-touched if still open. */
  resumeItemId?: string;
}
