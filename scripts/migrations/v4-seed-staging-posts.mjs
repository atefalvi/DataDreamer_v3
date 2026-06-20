#!/usr/bin/env node

/**
 * Seed a small v4 staging writing set.
 *
 * This is intentionally idempotent and credential-free in source. It creates or updates
 * a few polished, published posts so blog listing/detail, author pages, topic filters,
 * related posts, RSS, sitemap, and homepage latest-writing states can be tested against
 * realistic content.
 *
 *   DIRECTUS_URL=http://192.168.10.211:8056 DIRECTUS_TOKEN=... \
 *     node scripts/v4-seed-staging-posts.mjs
 */

const BASE = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_TOKEN;

if (!BASE || !TOKEN) {
  throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required.');
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

const POSTS = [
  {
    slug: 'signal-quality-before-dashboard-polish',
    title: 'Signal quality before dashboard polish',
    excerpt:
      'The expensive dashboard is usually hiding a cheaper problem: unclear signal ownership, weak definitions, and no confidence model.',
    author: 'atef-alvi',
    topics: ['data', 'infrastructure'],
    published_at: '2026-06-12T14:00:00.000Z',
    featured: true,
    series_label: 'Operating the signal',
    post_number: 1,
    content: `Most dashboards fail before a single chart is drawn. The failure happens in the contract around the signal: who owns it, what it means, and how much trust the reader should place in it.

:::note The operating rule
A metric is not production-ready until it has an owner, a definition, and a failure mode.
:::

The visual layer can only make a clear system more legible. It cannot rescue a metric that changes meaning every quarter or silently drops records when an upstream job stalls.

## The three-part contract

1. **Definition** — the plain-language promise behind the number.
2. **Lineage** — the systems and transformations that shape it.
3. **Confidence** — freshness, completeness, and known caveats.

When those pieces sit beside the chart, the dashboard becomes an instrument instead of a decoration. Leaders can ask better questions, analysts can debug faster, and engineering has a shared target for reliability.`,
  },
  {
    slug: 'why-data-dreamer-exists',
    title: 'Why Data Dreamer exists',
    excerpt:
      'Data Dreamer is a place for serious data work: systems thinking, applied AI, analytics craft, and the editorial judgment that makes technical work legible.',
    author: 'atef-alvi',
    topics: ['research', 'data'],
    published_at: '2026-06-11T16:00:00.000Z',
    featured: false,
    series_label: 'Studio notes',
    post_number: 1,
    content: `Data Dreamer exists because the most valuable data work is rarely a single dashboard, model, or launch. It is the connective tissue between systems: definitions people trust, interfaces people can read, and engineering decisions that hold up when the data gets messy.

:::note The premise
Good data work should feel both technically rigorous and editorially clear.
:::

The internet has enough tactical fragments. What is missing is a studio-minded way to talk about data products, applied AI, research systems, and analytics infrastructure as one craft.

## What we care about

We care about signal quality before visual polish. We care about model behavior that can be inspected. We care about dashboards that explain their assumptions. We care about teams that can move quickly without hiding complexity from the people who depend on the work.

Data Dreamer is the notebook for that practice: part publication, part lab, part operating manual for building intelligent systems with taste and accountability.`,
  },
  {
    slug: 'people-analytics-without-surveillance',
    title: 'People analytics without surveillance theater',
    excerpt:
      'Useful people analytics starts with trust boundaries: aggregate signals, transparent definitions, and decisions humans can inspect.',
    author: 'maria-khan',
    topics: ['research', 'data'],
    published_at: '2026-06-10T15:30:00.000Z',
    featured: false,
    series_label: 'Human systems',
    post_number: 1,
    content: `People analytics has a reputation problem because too many teams treat it like monitoring. The better version is quieter and more useful: aggregate signals that help organizations improve conditions without turning employees into dashboards.

:::warning Trust is part of the model
If the people being measured cannot understand the metric, the metric will eventually distort behavior.
:::

The strongest people analytics programs publish their definitions, use thresholds that protect small groups, and connect every metric to a decision the organization is willing to own.

## What good looks like

- retention signals grouped above a privacy threshold;
- hiring funnel analysis that separates process friction from candidate quality;
- engagement themes summarized with context, not ranked as individual scores;
- model outputs reviewed by people before policy changes.

The goal is not to make management omniscient. The goal is to make organizational patterns visible enough to improve them responsibly.`,
  },
  {
    slug: 'market-data-pipelines-need-memory',
    title: 'Market data pipelines need memory',
    excerpt:
      'Financial data systems get sharper when they remember late ticks, corrected values, and the assumptions attached to every derived signal.',
    author: 'moe-zulfiqar',
    topics: ['infrastructure', 'machine-learning'],
    published_at: '2026-06-08T13:15:00.000Z',
    featured: false,
    series_label: 'Markets as systems',
    post_number: 1,
    content: `Market data is never as clean as the chart suggests. Values arrive late, vendors revise history, and derived signals inherit every assumption that came before them.

:::tip Build for revision
A pipeline that cannot explain what changed yesterday is not ready for a trading desk.
:::

The fix is not just faster ingestion. It is memory: versioned facts, correction events, and metadata that explains which rule produced each signal at a point in time.

## A practical pattern

Store raw observations separately from normalized facts. Treat vendor corrections as events, not overwrites. Attach model or rule versions to every feature table. When a backtest changes, you can trace whether the strategy improved or the data moved under it.

That kind of memory is not glamorous, but it is where trust in financial systems actually comes from.`,
  },
];

async function main() {
  const [authors, topics, existingPosts, existingJunctions] = await Promise.all([
    api('/items/authors?fields=id,slug,display_name&limit=-1'),
    api('/items/topics?fields=id,slug,name&limit=-1'),
    api('/items/posts?fields=id,slug&limit=-1'),
    api('/items/posts_topics?fields=id,posts_id,topics_id&limit=-1'),
  ]);

  const authorIdBySlug = new Map(authors.map((author) => [author.slug, author.id]));
  const topicIdBySlug = new Map(topics.map((topic) => [topic.slug, topic.id]));
  const postIdBySlug = new Map(existingPosts.map((post) => [post.slug, post.id]));
  const junctions = new Set(
    existingJunctions
      .map((row) => `${relationId(row.posts_id)}:${relationId(row.topics_id)}`)
      .filter((key) => !key.includes('undefined')),
  );

  for (const post of POSTS) {
    const authorId = authorIdBySlug.get(post.author);
    if (!authorId) throw new Error(`Missing author: ${post.author}`);

    const topicIds = post.topics.map((slug) => {
      const id = topicIdBySlug.get(slug);
      if (!id) throw new Error(`Missing topic: ${slug}`);
      return id;
    });

    const payload = {
      status: 'published',
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published_at: post.published_at,
      featured: post.featured,
      series_label: post.series_label,
      post_number: post.post_number,
      author: authorId,
    };

    let postId = postIdBySlug.get(post.slug);
    if (postId) {
      await api(`/items/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      console.log(`~ post ${post.slug}`);
    } else {
      const created = await api('/items/posts', { method: 'POST', body: JSON.stringify(payload) });
      postId = created.id;
      postIdBySlug.set(post.slug, postId);
      console.log(`+ post ${post.slug}`);
    }

    for (const topicId of topicIds) {
      const key = `${postId}:${topicId}`;
      if (junctions.has(key)) continue;
      await api('/items/posts_topics', {
        method: 'POST',
        body: JSON.stringify({ posts_id: postId, topics_id: topicId }),
      });
      junctions.add(key);
      console.log(`  + topic link ${post.slug}`);
    }
  }

  const published = await api(
    '/items/posts?filter[status][_eq]=published&fields=slug,title,author.slug,topics.topics_id.slug&sort=-published_at&limit=-1',
  );
  console.log('\nPublished posts ready for staging:');
  for (const post of published) {
    const topicSlugs = (post.topics ?? [])
      .map((topic) => topic?.topics_id?.slug)
      .filter(Boolean)
      .join(', ');
    console.log(`  ${post.slug.padEnd(44)} ${post.author?.slug ?? 'no-author'} · ${topicSlugs}`);
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${response.status} ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

function relationId(value) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.id;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
