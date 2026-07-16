/**
 * Directus collection row shapes (v4.0), mirroring backend/snapshot.yaml.
 *
 * These describe the *raw* API payloads. They are intentionally permissive about
 * relational fields (a relation is either an id string or an expanded object,
 * depending on the `fields` query) — the repository mappers narrow them into the
 * strict view-models in `src/types/content.ts`. Nothing outside `lib/` should import
 * these; pages and components only see view-models.
 */

export interface DirectusFile {
  id: string;
  width?: number | null;
  height?: number | null;
  description?: string | null;
}

type Relation<T> = T | string | null;

export interface SpecialtyRow {
  id: string;
  status: string;
  name: string;
  slug: string;
  description?: string | null;
  color_key?: string | null;
  sort?: number | null;
}

export interface TopicRow {
  id: string;
  status: string;
  name: string;
  slug: string;
  description?: string | null;
  date_updated?: string | null;
}

export interface AuthorSpecialtyRow {
  id: string;
  sort?: number | null;
  specialties_id: Relation<SpecialtyRow>;
}

export interface AuthorRow {
  id: string;
  status: string;
  slug: string;
  display_name: string;
  role_title: string;
  bio?: string | null;
  statement?: string | null;
  avatar?: Relation<DirectusFile>;
  links?: unknown;
  tools?: unknown;
  featured_work?: unknown;
  sort?: number | null;
  /** Admin approval to appear on the public Dream Team page (v4.2 account model). */
  dream_team?: boolean | null;
  specialties?: AuthorSpecialtyRow[];
  date_updated?: string | null;
}

export interface PostTopicRow {
  id: string;
  topics_id: Relation<TopicRow>;
}

export interface PostRow {
  id: string;
  status: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  published_at?: string | null;
  date_updated?: string | null;
  date_created?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  noindex?: boolean | null;
  post_number?: number | null;
  series_label?: string | null;
  featured?: boolean | null;
  author?: Relation<AuthorRow>;
  cover_image?: Relation<DirectusFile>;
  topics?: PostTopicRow[];
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectRow {
  id: string;
  status: string;
  title: string;
  slug: string;
  summary?: string | null;
  body?: string | null;
  year?: number | null;
  role?: string | null;
  author?: Relation<AuthorRow>;
  cover_image?: Relation<DirectusFile>;
  cover_alt?: string | null;
  tags?: string[] | null;
  links?: ProjectLink[] | null;
  featured?: boolean | null;
  sort?: number | null;
  date_updated?: string | null;
  date_created?: string | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  noindex?: boolean | null;
  topics?: ProjectTopicRow[];
}

export interface ProjectTopicRow {
  id: string;
  topics_id: Relation<TopicRow>;
}

/* ── Field Guides (v4.1) ─────────────────────────────────────────────────────── */

export interface GuideTopicRow {
  id: string;
  topics_id: Relation<TopicRow>;
}

export interface GuideSpecialtyRow {
  id: string;
  sort?: number | null;
  specialties_id: Relation<SpecialtyRow>;
}

export interface GuideAuthorRow {
  id: string;
  sort?: number | null;
  authors_id: Relation<AuthorRow>;
}

export interface GuideItemRow {
  id: string;
  type: string;
  title: string;
  url?: string | null;
  asset?: Relation<DirectusFile>;
  body?: string | null;
  description?: string | null;
  why_included?: string | null;
  focus_on?: string | null;
  notes?: string | null;
  estimated_time_minutes?: number | null;
  difficulty?: string | null;
  sort?: number | null;
}

export interface GuideSectionRow {
  id: string;
  title: string;
  description?: string | null;
  sort?: number | null;
  items?: GuideItemRow[];
}

export interface GuideRow {
  id: string;
  status: string;
  slug: string;
  title: string;
  summary?: string | null;
  cover_image?: Relation<DirectusFile>;
  difficulty?: string | null;
  estimated_duration_minutes?: number | null;
  featured?: boolean | null;
  why_this_path?: string | null;
  expected_outcome?: string | null;
  recommended_audience?: string | null;
  author?: Relation<AuthorRow>;
  authors?: GuideAuthorRow[];
  topics?: GuideTopicRow[];
  specialties?: GuideSpecialtyRow[];
  sections?: GuideSectionRow[];
  sort?: number | null;
  date_created?: string | null;
  date_updated?: string | null;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  noindex?: boolean | null;
}

/** One row per user+guide (08 §4.5). `completed_items` is a json string[] of item ids. */
export interface GuideProgressRow {
  id: string;
  user: Relation<{ id: string }>;
  guide: Relation<GuideRow>;
  completed_items?: string[] | null;
  last_item?: Relation<GuideItemRow>;
  status?: string | null;
  percent?: number | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/** Typed schema handed to `createDirectus<Schema>()`. */
export interface Schema {
  posts: PostRow[];
  authors: AuthorRow[];
  topics: TopicRow[];
  specialties: SpecialtyRow[];
  projects: ProjectRow[];
  projects_topics: ProjectTopicRow[];
  posts_topics: PostTopicRow[];
  authors_specialties: AuthorSpecialtyRow[];
  directus_files: DirectusFile[];
  // v4.1 Field Guides
  guides: GuideRow[];
  guide_sections: GuideSectionRow[];
  guide_items: GuideItemRow[];
  guides_topics: GuideTopicRow[];
  guides_specialties: GuideSpecialtyRow[];
  guides_authors: GuideAuthorRow[];
  guide_progress: GuideProgressRow[];
}
