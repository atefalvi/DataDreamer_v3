/**
 * Non-mutating check for the frontend's Guide Server credential.
 *
 *   DIRECTUS_URL=https://api.example.com DIRECTUS_SERVICE_TOKEN=... \
 *     node scripts/v4-guides-service-check.mjs
 *
 * The token is never printed. This checks the same collections the Astro server needs.
 */
const BASE = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_SERVICE_TOKEN;
if (!BASE || !TOKEN) {
  throw new Error('Set DIRECTUS_URL and DIRECTUS_SERVICE_TOKEN (the Guide Server service-user static token).');
}

async function read(path) {
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} returned ${response.status}. Check the Guide Server role/policy.`);
  return json.data;
}

const guides = await read('/items/guides?filter[status][_eq]=published&fields=id,slug,title&limit=1');
if (!guides.length) throw new Error('Credential works, but Directus has no published guide. Run the guide seed or publish a guide.');
// The frontend verifies a learner's id with their own session before requesting this
// server-only profile read. Do not print user data from this infrastructure check.
await read('/users?fields=id,google_picture_url&limit=1');
const full = await read(`/items/guides?filter[id][_eq]=${guides[0].id}&fields=sections.id,sections.items.id,sections.items.body&limit=1`);
const sections = full[0]?.sections ?? [];
const items = sections.flatMap((section) => section.items ?? []);
if (!sections.length || !items.length || !items.some((item) => item.body)) {
  throw new Error('Guide found, but sections/items/body are unavailable. Check seed data and Guide Server read fields.');
}

console.log(`Guide Server ready: ${guides[0].title} (${sections.length} sections, ${items.length} items sampled; learner profile read available).`);
