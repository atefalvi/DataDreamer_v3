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
  specialties?: AuthorSpecialtyRow[];
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
  post_number?: number | null;
  series_label?: string | null;
  featured?: boolean | null;
  author?: Relation<AuthorRow>;
  cover_image?: Relation<DirectusFile>;
  topics?: PostTopicRow[];
}

/** Typed schema handed to `createDirectus<Schema>()`. */
export interface Schema {
  posts: PostRow[];
  authors: AuthorRow[];
  topics: TopicRow[];
  specialties: SpecialtyRow[];
  posts_topics: PostTopicRow[];
  authors_specialties: AuthorSpecialtyRow[];
  directus_files: DirectusFile[];
}
