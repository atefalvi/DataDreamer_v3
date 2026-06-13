/**
 * V4-DT seed — Dream Team starter data (idempotent).
 *
 * Creates the domain specialties + author profiles the Dream Team graph needs, so the
 * constellation renders with real people clustered by their field. Safe to re-run: it
 * looks up by slug and skips/links rather than duplicating.
 *
 *   DIRECTUS_URL=… DIRECTUS_TOKEN=…  node scripts/v4-dt-seed-directus.mjs
 *
 * Authors here are the publication's contributors, each in their professional domain;
 * the editorial angle is "how data is used in <their field>".
 */
const BASE = process.env.DIRECTUS_URL;
const TOKEN = process.env.DIRECTUS_TOKEN;
if (!BASE || !TOKEN) throw new Error('DIRECTUS_URL and DIRECTUS_TOKEN are required.');

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${options.method ?? 'GET'} ${path} → ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const SPECIALTIES = [
  { slug: 'data-engineering', name: 'Data Engineering', color_key: 'viz-1', description: 'Pipelines, platforms, and the systems that move data.' },
  { slug: 'people-hr', name: 'People & HR', color_key: 'viz-6', description: 'People analytics — hiring, retention, and engagement, evidenced by data.' },
  { slug: 'capital-markets', name: 'Capital Markets', color_key: 'viz-2', description: 'Markets, risk, and the models behind trading and investment decisions.' },
];

const AUTHORS = [
  {
    slug: 'maria-khan',
    display_name: 'Maria Khan',
    role_title: 'HR & People Analytics',
    bio: 'Maria is an HR professional focused on people analytics — turning hiring, retention, and engagement data into decisions leaders can trust. She writes about how data is reshaping the way teams are built, measured, and grown.',
    statement: 'People are the dataset most worth getting right.',
    specialties: ['people-hr'],
    sort: 2,
  },
  {
    slug: 'moe-zulfiqar',
    display_name: 'Moe Zulfiqar',
    role_title: 'Capital Markets Analyst',
    bio: 'Moe works in capital markets, where basis points and milliseconds compound. He writes about data in finance — market microstructure, risk, and the models behind real trading and investment decisions.',
    statement: 'In markets, the edge is in the data nobody else bothered to clean.',
    specialties: ['capital-markets'],
    sort: 3,
  },
  // Existing author — ensure a specialty link so they cluster in the graph.
  { slug: 'atef-alvi', specialties: ['data-engineering'], onlyLinkSpecialties: true },
];

async function main() {
  // 1) Specialties — create any that are missing.
  const existingSpecialties = await api('/items/specialties?fields=id,slug&limit=-1');
  const specialtyId = new Map(existingSpecialties.map((s) => [s.slug, s.id]));
  for (const spec of SPECIALTIES) {
    if (specialtyId.has(spec.slug)) {
      console.log(`= specialty ${spec.slug} (exists)`);
      continue;
    }
    const created = await api('/items/specialties', {
      method: 'POST',
      body: JSON.stringify({ status: 'published', sort: 1, ...spec }),
    });
    specialtyId.set(spec.slug, created.id);
    console.log(`+ specialty ${spec.slug}`);
  }

  // 2) Authors — create or link specialties.
  const existingAuthors = await api('/items/authors?fields=id,slug,specialties.specialties_id.slug&limit=-1');
  const authorBySlug = new Map(existingAuthors.map((a) => [a.slug, a]));

  for (const author of AUTHORS) {
    const links = author.specialties.map((slug, i) => ({ specialties_id: specialtyId.get(slug), sort: i + 1 }));
    const found = authorBySlug.get(author.slug);

    if (found) {
      const current = (found.specialties ?? []).map((s) => s?.specialties_id?.slug).filter(Boolean);
      const missing = author.specialties.filter((s) => !current.includes(s));
      if (missing.length) {
        await api(`/items/authors/${found.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ specialties: missing.map((slug, i) => ({ specialties_id: specialtyId.get(slug), sort: current.length + i + 1 })) }),
        });
        console.log(`~ author ${author.slug} linked ${missing.join(', ')}`);
      } else {
        console.log(`= author ${author.slug} (exists, linked)`);
      }
      continue;
    }
    if (author.onlyLinkSpecialties) {
      console.log(`! author ${author.slug} not found — skipped`);
      continue;
    }

    await api('/items/authors', {
      method: 'POST',
      body: JSON.stringify({
        status: 'published',
        slug: author.slug,
        display_name: author.display_name,
        role_title: author.role_title,
        bio: author.bio,
        statement: author.statement,
        links: [],
        tools: [],
        featured_work: [],
        sort: author.sort,
        specialties: links,
      }),
    });
    console.log(`+ author ${author.slug}`);
  }

  const after = await api('/items/authors?fields=slug,specialties.specialties_id.name&limit=-1&filter[status][_eq]=published');
  console.log('\nPublished authors:');
  for (const a of after) {
    console.log(`  ${a.slug.padEnd(16)} ${(a.specialties ?? []).map((s) => s?.specialties_id?.name).filter(Boolean).join(', ')}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
