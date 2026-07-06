/**
 * Row → view-model mappers shared across repositories. No repository imports another
 * repository's internals; shared mapping lives here (09 §4.4).
 */
import { renderMarkdown } from '../markdown';
import { toImageRef } from '../images';
import {
  authorLinksSchema,
  featuredWorkSchema,
  toolsSchema,
} from '../validation/schemas';
import type {
  AuthorRow,
  GuideAuthorRow,
  GuideItemRow,
  GuideRow,
  GuideSectionRow,
  GuideSpecialtyRow,
  GuideTopicRow,
  PostRow,
  PostTopicRow,
  ProjectRow,
  SpecialtyRow,
  TopicRow,
} from '../directus/schema';
import type {
  Author,
  AuthorRef,
  AuthorSummary,
  Guide,
  GuideDifficulty,
  GuideItem,
  GuideItemType,
  GuideListItem,
  GuideSection,
  Post,
  PostListItem,
  Project,
  ProjectListItem,
  SpecialtyRef,
  Topic,
  TopicRef,
} from '../../types/content';

function asObject<T>(relation: T | string | null | undefined): T | undefined {
  return relation && typeof relation === 'object' ? (relation as T) : undefined;
}

export function mapTopic(row: TopicRow): Topic {
  return { name: row.name, slug: row.slug, description: row.description ?? undefined };
}

export function mapTopicRef(row: TopicRow): TopicRef {
  return { name: row.name, slug: row.slug };
}

function mapPostTopics(topics: PostTopicRow[] | undefined): TopicRef[] {
  if (!topics) return [];
  return topics
    .map((t) => asObject<TopicRow>(t.topics_id))
    .filter((t): t is TopicRow => Boolean(t))
    .map(mapTopicRef);
}

export function mapSpecialtyRef(row: SpecialtyRow): SpecialtyRef {
  return { name: row.name, slug: row.slug, colorKey: row.color_key ?? 'viz-1' };
}

function mapAuthorRef(row: AuthorRow | undefined): AuthorRef {
  if (!row) return { slug: 'unknown', name: 'DataDreamer', dreamTeam: false };
  return {
    slug: row.slug,
    name: row.display_name,
    avatar: toImageRef(row.avatar, row.display_name),
    // Only an explicit false (field selected, author not approved) drops the byline
    // link; queries that don't select dream_team keep today's linking behavior.
    dreamTeam: row.dream_team !== false,
  };
}

/** Author specialties, ordered by junction `sort` (first = primary, 07 §5.2). */
function mapAuthorSpecialties(row: AuthorRow): SpecialtyRef[] {
  const links = [...(row.specialties ?? [])].sort(
    (a, b) => (a.sort ?? 0) - (b.sort ?? 0),
  );
  return links
    .map((link) => asObject<SpecialtyRow>(link.specialties_id))
    .filter((s): s is SpecialtyRow => Boolean(s))
    .map(mapSpecialtyRef);
}

export function mapPostListItem(row: PostRow): PostListItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    publishedAt: new Date(row.published_at ?? Date.now()),
    topics: mapPostTopics(row.topics),
    author: mapAuthorRef(asObject<AuthorRow>(row.author)),
    coverImage: toImageRef(row.cover_image, row.title),
    featured: Boolean(row.featured),
    seriesLabel: row.series_label ?? undefined,
    postNumber: row.post_number ?? undefined,
  };
}

export async function mapPost(row: PostRow): Promise<Post> {
  const { html, headings, readingMinutes } = await renderMarkdown(row.content ?? '');
  return {
    ...mapPostListItem(row),
    bodyHtml: html,
    headings,
    readingMinutes,
  };
}

export function mapProjectListItem(row: ProjectRow): ProjectListItem {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    year: row.year ?? new Date().getFullYear(),
    role: row.role ?? '',
    author: mapAuthorRef(asObject<AuthorRow>(row.author)),
    coverImage: toImageRef(row.cover_image, row.cover_alt ?? row.title),
    tags: Array.isArray(row.tags) ? row.tags : [],
    links: Array.isArray(row.links) ? row.links : [],
    featured: Boolean(row.featured),
  };
}

export async function mapProject(row: ProjectRow): Promise<Project> {
  const { html } = await renderMarkdown(row.body ?? '');
  return { ...mapProjectListItem(row), bodyHtml: html };
}

export function mapAuthorSummary(row: AuthorRow, postCount: number): AuthorSummary {
  return {
    ...mapAuthorRef(row),
    roleTitle: row.role_title,
    specialties: mapAuthorSpecialties(row),
    postCount,
    guideCount: 0,
  };
}

export async function mapAuthor(row: AuthorRow, postCount: number): Promise<Author> {
  const { html } = await renderMarkdown(row.bio ?? '');
  return {
    ...mapAuthorSummary(row, postCount),
    bioHtml: html,
    statement: row.statement ?? undefined,
    links: authorLinksSchema.parse(row.links ?? []),
    tools: toolsSchema.parse(row.tools ?? []),
    featuredWork: featuredWorkSchema.parse(row.featured_work ?? []),
  };
}

/* ── Field Guides (v4.1) ─────────────────────────────────────────────────────── */

const GUIDE_DIFFICULTIES: GuideDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const GUIDE_ITEM_TYPES: GuideItemType[] = [
  'youtube', 'external_url', 'pdf', 'uploaded_file', 'notebooklm', 'github_repo',
  'code_sample', 'cheat_sheet', 'personal_note', 'exercise', 'docs_page',
];

function guideDifficulty(value: string | null | undefined): GuideDifficulty {
  return GUIDE_DIFFICULTIES.includes(value as GuideDifficulty)
    ? (value as GuideDifficulty)
    : 'beginner';
}

function itemDifficulty(value: string | null | undefined): GuideDifficulty | undefined {
  return GUIDE_DIFFICULTIES.includes(value as GuideDifficulty)
    ? (value as GuideDifficulty)
    : undefined;
}

function guideItemType(value: string | null | undefined): GuideItemType {
  return GUIDE_ITEM_TYPES.includes(value as GuideItemType)
    ? (value as GuideItemType)
    : 'external_url';
}

async function renderOptional(md: string | null | undefined): Promise<string | undefined> {
  const source = (md ?? '').trim();
  if (!source) return undefined;
  return (await renderMarkdown(source)).html;
}

function bySort<T extends { sort?: number | null }>(rows: T[] | undefined): T[] {
  return [...(rows ?? [])].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function mapGuideTopics(topics: GuideTopicRow[] | undefined): TopicRef[] {
  if (!topics) return [];
  return topics
    .map((t) => asObject<TopicRow>(t.topics_id))
    .filter((t): t is TopicRow => Boolean(t))
    .map(mapTopicRef);
}

function mapGuideSpecialties(rows: GuideSpecialtyRow[] | undefined): SpecialtyRef[] {
  return bySort(rows)
    .map((link) => asObject<SpecialtyRow>(link.specialties_id))
    .filter((s): s is SpecialtyRow => Boolean(s))
    .map(mapSpecialtyRef);
}

/** Primary curator first, then additional contributors (deduped by slug). */
function mapGuideCurators(row: GuideRow): AuthorRef[] {
  const primary = asObject<AuthorRow>(row.author);
  const extras = bySort<GuideAuthorRow>(row.authors)
    .map((link) => asObject<AuthorRow>(link.authors_id))
    .filter((a): a is AuthorRow => Boolean(a));
  const ordered = [primary, ...extras].filter((a): a is AuthorRow => Boolean(a));
  const seen = new Set<string>();
  const curators: AuthorRef[] = [];
  for (const author of ordered) {
    if (seen.has(author.slug)) continue;
    seen.add(author.slug);
    curators.push(mapAuthorRef(author));
  }
  return curators;
}

/**
 * Map a guide item. When `unlocked` (authenticated reader), include the gated fields and
 * render markdown bodies/annotations; otherwise return the preview shape (08 §5).
 */
export async function mapGuideItem(row: GuideItemRow, unlocked: boolean): Promise<GuideItem> {
  const base: GuideItem = {
    id: row.id,
    type: guideItemType(row.type),
    title: row.title,
    description: row.description ?? undefined,
    estimatedMinutes: row.estimated_time_minutes ?? undefined,
    difficulty: itemDifficulty(row.difficulty),
    locked: !unlocked,
  };
  if (!unlocked) return base;

  const [bodyHtml, whyIncludedHtml, focusOnHtml, notesHtml] = await Promise.all([
    renderOptional(row.body),
    renderOptional(row.why_included),
    renderOptional(row.focus_on),
    renderOptional(row.notes),
  ]);
  return {
    ...base,
    url: row.url ?? undefined,
    asset: toImageRef(row.asset, row.title),
    bodyHtml,
    whyIncludedHtml,
    focusOnHtml,
    notesHtml,
  };
}

async function mapGuideSection(row: GuideSectionRow, unlocked: boolean): Promise<GuideSection> {
  const items = await Promise.all(bySort(row.items).map((item) => mapGuideItem(item, unlocked)));
  return {
    id: row.id,
    title: row.title,
    descriptionHtml: await renderOptional(row.description),
    items,
  };
}

export function mapGuideListItem(
  row: GuideRow,
  counts: { itemCount: number; sectionCount: number },
): GuideListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    difficulty: guideDifficulty(row.difficulty),
    coverImage: toImageRef(row.cover_image, row.title),
    estimatedMinutes: row.estimated_duration_minutes ?? undefined,
    itemCount: counts.itemCount,
    sectionCount: counts.sectionCount,
    featured: Boolean(row.featured),
    curator: mapAuthorRef(asObject<AuthorRow>(row.author)),
    topics: mapGuideTopics(row.topics),
  };
}

/** Full guide (preview when `unlocked=false`, reader when true). Sections must be expanded. */
export async function mapGuide(row: GuideRow, unlocked: boolean): Promise<Guide> {
  const sections = await Promise.all(
    bySort(row.sections).map((section) => mapGuideSection(section, unlocked)),
  );
  const itemCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const [whyThisPathHtml, expectedOutcomeHtml] = await Promise.all([
    renderOptional(row.why_this_path),
    renderOptional(row.expected_outcome),
  ]);
  return {
    ...mapGuideListItem(row, { itemCount, sectionCount: sections.length }),
    whyThisPathHtml: whyThisPathHtml ?? '',
    expectedOutcomeHtml,
    recommendedAudience: row.recommended_audience ?? undefined,
    curators: mapGuideCurators(row),
    specialties: mapGuideSpecialties(row.specialties),
    sections,
    unlocked,
  };
}
