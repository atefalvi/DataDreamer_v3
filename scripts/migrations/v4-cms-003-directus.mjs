/**
 * V4-CMS-003 — Topics backfill.
 *
 * Ensures every PUBLISHED post has at least one topic by creating `posts_topics`
 * junction rows. There are no v4 `tag`/`category` compatibility fields, so assignment
 * is heuristic: keyword matches against the post slug + title map to topic slugs, with
 * a configurable fallback for anything unmatched. Idempotent — posts that already carry
 * ≥1 topic are skipped, and existing (post, topic) pairs are never duplicated.
 *
 * Run where Directus is reachable:
 *   DIRECTUS_URL=… DIRECTUS_TOKEN=…  node scripts/v4-cms-003-directus.mjs
 *   (or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD instead of a token)
 *   Add DRY_RUN=1 to preview the mapping without writing.
 *
 * Prints a mapping table (post → topics) to copy into the V4-CMS-003 handoff entry.
 */
import {
  createDirectus,
  rest,
  staticToken,
  authentication,
  readItems,
  createItems,
} from '../frontend/node_modules/@directus/sdk/dist/index.js';

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;
const DIRECTUS_ADMIN_EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const DIRECTUS_ADMIN_PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!DIRECTUS_URL || (!DIRECTUS_TOKEN && (!DIRECTUS_ADMIN_EMAIL || !DIRECTUS_ADMIN_PASSWORD))) {
  throw new Error('DIRECTUS_URL and either DIRECTUS_TOKEN or DIRECTUS_ADMIN_EMAIL/DIRECTUS_ADMIN_PASSWORD are required.');
}

/**
 * Heuristic keyword → topic-slug rules (first match wins; order matters). Topic slugs
 * must exist in the `topics` collection (seeded in V4-CMS-003 mapping / example-records).
 */
const KEYWORD_RULES = [
  { topic: 'machine-learning', match: /(machine learning|ml|fine.?tun|model|train|eval|llm|inference)/i },
  { topic: 'infrastructure', match: /(docker|deploy|ci\/cd|cicd|infra|kubernet|homelab|coolify|server|pipeline|airflow|orchestrat)/i },
  { topic: 'data', match: /(dataset|scrap|clean|etl|warehouse|dbt|sql|postgres|duckdb|ingest)/i },
  { topic: 'research', match: /(paper|research|reading|study|benchmark)/i },
  { topic: 'tools', match: /(tool|cli|library|framework|review|comparison)/i },
  { topic: 'devlog', match: /(devlog|build|progress|notes|update|wip|journal)/i },
];
/** Anything unmatched lands here so the "≥1 topic" guarantee always holds. */
const FALLBACK_TOPIC = 'devlog';

const directus = DIRECTUS_TOKEN
  ? createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest())
  : createDirectus(DIRECTUS_URL).with(authentication()).with(rest());

async function main() {
  if (!DIRECTUS_TOKEN) {
    await directus.login(DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD);
  }

  const topics = await directus.request(readItems('topics', { fields: ['id', 'slug', 'name'], limit: -1 }));
  const topicIdBySlug = new Map(topics.map((t) => [t.slug, t.id]));
  const missingRuleTargets = [...new Set([...KEYWORD_RULES.map((r) => r.topic), FALLBACK_TOPIC])].filter(
    (slug) => !topicIdBySlug.has(slug),
  );
  if (missingRuleTargets.length) {
    throw new Error(
      `These rule target topics are missing from the topics collection: ${missingRuleTargets.join(', ')}. ` +
        'Seed them first (see assets/content-models/example-records.md → topics).',
    );
  }

  const posts = await directus.request(
    readItems('posts', {
      filter: { status: { _eq: 'published' } },
      fields: ['id', 'slug', 'title', 'topics.topics_id.slug'],
      limit: -1,
    }),
  );

  const newRows = [];
  const report = [];

  for (const post of posts) {
    const existing = (post.topics ?? [])
      .map((t) => t?.topics_id?.slug)
      .filter(Boolean);
    if (existing.length > 0) {
      report.push({ slug: post.slug, assigned: existing, status: 'skip (already tagged)' });
      continue;
    }

    const haystack = `${post.slug ?? ''} ${post.title ?? ''}`;
    const matched = KEYWORD_RULES.filter((rule) => rule.match.test(haystack)).map((r) => r.topic);
    const assigned = matched.length ? [...new Set(matched)].slice(0, 3) : [FALLBACK_TOPIC];

    for (const topicSlug of assigned) {
      newRows.push({ posts_id: post.id, topics_id: topicIdBySlug.get(topicSlug) });
    }
    report.push({ slug: post.slug, assigned, status: DRY_RUN ? 'planned' : 'created' });
  }

  if (newRows.length && !DRY_RUN) {
    await directus.request(createItems('posts_topics', newRows));
  }

  // Mapping table for the handoff.
  console.log('\nV4-CMS-003 topics backfill — mapping');
  console.log('post slug'.padEnd(48), 'topics', '  ', 'status');
  for (const row of report) {
    console.log(String(row.slug).padEnd(48), row.assigned.join(', ').padEnd(28), row.status);
  }
  console.log(
    `\n${report.length} published posts · ${newRows.length} posts_topics rows ${DRY_RUN ? 'planned (dry run)' : 'created'}.`,
  );

  const stillEmpty = report.filter((r) => r.assigned.length === 0);
  if (stillEmpty.length) {
    throw new Error(`Guarantee violated — ${stillEmpty.length} posts ended with no topic.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
