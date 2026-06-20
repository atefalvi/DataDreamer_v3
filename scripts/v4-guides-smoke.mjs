/**
 * V4-QA-004 — Field Guides post-deploy smoke. Runs the full reader journey against a
 * live environment so each deploy step can be verified with one command.
 *
 *   DIRECTUS_ADMIN_TOKEN=<token> node scripts/v4-guides-smoke.mjs <directusUrl> [frontendUrl]
 *
 * directusUrl  default http://192.168.10.211:8056
 * frontendUrl  optional — also checks the public catalogue + preview HTML
 * Exits non-zero if any check fails. Admin token only used to clean up the temp user.
 */
const DIRECTUS = (process.argv[2] || process.env.DIRECTUS_URL || 'http://192.168.10.211:8056').replace(/\/$/, '');
const FRONTEND = (process.argv[3] || process.env.FRONTEND_URL || '').replace(/\/$/, '');
const ADMIN = process.env.DIRECTUS_ADMIN_TOKEN || process.env.DIRECTUS_TOKEN;
const SLUG = process.env.GUIDE_SLUG || 'learn-airflow-the-real-way';

const results = [];
const check = (pass, label, note = '') => results.push({ pass: !!pass, label, note });

async function req(base, path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
      const text = await res.text();
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON (e.g. /server/ping → "pong") */ }
      return { status: res.status, json, text };
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return { status: 0, json: {}, text: '' };
}

async function main() {
  // Directus reachable
  const ping = await req(DIRECTUS, '/server/ping');
  check(ping.text.includes('pong'), 'directus reachable');

  // Google provider registered (informational — warns, doesn't fail the suite)
  const auth = await req(DIRECTUS, '/auth');
  const hasGoogle = (auth.json.data || []).some((p) => p.name === 'google');
  check(true, `google SSO provider ${hasGoogle ? 'registered ✓' : 'NOT registered (restart Directus to load AUTH_GOOGLE_*)'}`);

  // anon catalogue: published guides
  const list = await req(DIRECTUS, `/items/guides?filter[status][_eq]=published&fields=slug&limit=10`);
  check(list.status === 200 && (list.json.data || []).length >= 1, 'anon catalogue lists published guides');

  // anon preview: hero + syllabus titles, no need for token
  const prev = await req(DIRECTUS, `/items/guides?filter[slug][_eq]=${SLUG}&fields=title,sections.items.title&limit=1`);
  const pg = (prev.json.data || [])[0] || {};
  const pItems = (pg.sections || []).flatMap((s) => s.items || []);
  check(prev.status === 200 && pg.title && pItems.length > 0, `anon preview renders (${pItems.length} item titles)`);

  // reader journey: register → login → gated read → progress
  const email = `smoke-${Date.now()}@example.com`;
  const pw = 'SmokePass12345!';
  const reg = await req(DIRECTUS, '/users/register', { method: 'POST', body: { email, password: pw } });
  check(reg.status === 204 || reg.status === 200, 'register guide_reader');

  const login = await req(DIRECTUS, '/auth/login', { method: 'POST', body: { email, password: pw, mode: 'json' } });
  const at = login.json.data?.access_token;
  check(!!at, 'login → access token');

  const me = await req(DIRECTUS, '/users/me?fields=id', { token: at });
  const meId = me.json.data?.id;

  const full = await req(DIRECTUS, `/items/guides?filter[slug][_eq]=${SLUG}&fields=id,sections.items.id,sections.items.body&limit=1`, { token: at });
  const fg = (full.json.data || [])[0] || {};
  const items = (fg.sections || []).flatMap((s) => s.items || []);
  const ids = items.map((i) => i.id);
  check(full.status === 200 && items.some((i) => i.body), 'reader reads gated item body');

  let rowId;
  if (at && meId && ids.length) {
    const create = await req(DIRECTUS, '/items/guide_progress?fields=id,percent', {
      method: 'POST', token: at,
      body: { user: meId, guide: fg.id, completed_items: [ids[0]], status: 'in-progress', percent: Math.round(100 / ids.length) },
    });
    rowId = create.json.data?.id;
    check(create.status < 300 && !!rowId, 'progress create');

    if (rowId) {
      const done = await req(DIRECTUS, `/items/guide_progress/${rowId}?fields=status,percent`, {
        method: 'PATCH', token: at, body: { completed_items: ids, status: 'completed', percent: 100 },
      });
      check(done.status === 200 && done.json.data?.percent === 100, 'progress complete → 100%');

      const back = await req(DIRECTUS, '/items/guide_progress?fields=percent,completed_items&limit=1', { token: at });
      check((back.json.data || [])[0]?.percent === 100, 'progress persists + reads back');
    }
  }

  // optional frontend checks
  if (FRONTEND) {
    const cat = await req(FRONTEND, '/guides');
    check(cat.status === 200 && !cat.text.includes('being assembled'), 'frontend /guides shows guides (not empty state)');
    const detail = await req(FRONTEND, `/guides/${SLUG}`);
    check(detail.status === 200, 'frontend /guides/[slug] renders');
  }

  // cleanup
  if (ADMIN) {
    if (rowId) await req(DIRECTUS, `/items/guide_progress/${rowId}`, { method: 'DELETE', token: ADMIN });
    const users = await req(DIRECTUS, '/users?filter[email][_starts_with]=smoke-&fields=id&limit=50', { token: ADMIN });
    const uids = (users.json.data || []).map((u) => u.id);
    if (uids.length) await req(DIRECTUS, '/users', { method: 'DELETE', token: ADMIN, body: uids });
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n  Field Guides smoke — ${DIRECTUS}${FRONTEND ? ' + ' + FRONTEND : ''}\n`);
  for (const r of results) console.log(`   ${r.pass ? '✅' : '❌'}  ${r.label}${r.note ? ' — ' + r.note : ''}`);
  console.log(`\n  ${passed}/${results.length} passed${ADMIN ? '' : '  (set DIRECTUS_ADMIN_TOKEN to auto-clean the temp user)'}\n`);
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
