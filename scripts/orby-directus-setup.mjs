/**
 * Orby Directus setup — the `orby` config singleton + read-only Orby role.
 *
 * Everything the owner tunes lives in Directus → Content → Orby (kill switch,
 * prompts, models, limits, handoff, notifications toggle). Deleting Orby later =
 * delete this collection + role + the widget env var; DataDreamer itself is untouched.
 *
 * The Orby role is READ-ONLY and least-privilege: config + published content only,
 * gated guide-item fields excluded at the FIELD level, no users, no mutations.
 * Seeded with enabled=false — turning Orby on is a deliberate owner action.
 *
 * Idempotent. Run: DIRECTUS_URL=… DIRECTUS_ADMIN_TOKEN=… node scripts/orby-directus-setup.mjs
 */

const BASE = process.env.DIRECTUS_URL ?? 'https://api.data-dreamer.net';
const TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
if (!TOKEN) {
  console.error('DIRECTUS_ADMIN_TOKEN is required.');
  process.exit(1);
}
const jsonHeaders = { 'Content-Type': 'application/json' };

async function api(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status} ${body.slice(0, 160)}`);
  }
  return res.status === 204 ? null : (await res.json()).data;
}

const exists = (path) => api(path).then(() => true).catch(() => false);

/* field helpers */
const bool = (field, def, note) => ({ field, type: 'boolean', schema: { default_value: def }, meta: { interface: 'boolean', note, width: 'half' } });
const str = (field, def, note) => ({ field, type: 'string', schema: { default_value: def }, meta: { interface: 'input', note, width: 'half' } });
const text = (field, def, note) => ({ field, type: 'text', schema: { default_value: def }, meta: { interface: 'input-multiline', note } });
const num = (field, def, note) => ({ field, type: 'integer', schema: { default_value: def }, meta: { interface: 'input', note, width: 'half' } });
const flt = (field, def, note) => ({ field, type: 'float', schema: { default_value: def }, meta: { interface: 'input', note, width: 'half' } });

const FIELDS = [
  // availability — the kill switches
  bool('enabled', false, 'Master switch: off = widget disappears from the site.'),
  bool('maintenance_mode', false, 'On = widget shows the maintenance message, no chat.'),
  str('maintenance_message', 'Orby is taking a short break — please try again soon.', ''),
  str('allowed_origins', 'https://data-dreamer.net,https://www.data-dreamer.net', 'Comma-separated origins allowed to embed the widget.'),
  // model
  str('chat_model', 'llama3.1:8b', 'Ollama chat model name'),
  str('embedding_model', 'nomic-embed-text', 'Ollama embedding model (dimension is pinned in the service env!)'),
  flt('temperature', 0.3, '0–2'),
  num('max_generation_tokens', 700, ''),
  num('request_timeout_seconds', 60, ''),
  // behaviour
  text('system_prompt', '', 'Leave blank to use the built-in default.'),
  text('welcome_message', "Hi, I'm Orby! Ask me anything about DataDreamer — articles, projects, guides, or the team.", ''),
  text('refusal_message', 'I can only help with questions about DataDreamer and its content.', ''),
  text('no_answer_message', "I couldn't find that in DataDreamer's published content. Try asking about our articles, projects, guides, or the team.", ''),
  text('out_of_scope_message', "That's outside what I know — I'm DataDreamer's assistant. Ask me about the site, its content, or the people behind it!", ''),
  // retrieval
  num('top_k', 6, 'Chunks retrieved per question (1–20)'),
  flt('min_retrieval_score', 0.35, 'Below this, Orby says it does not know (0–1).'),
  num('chunk_size', 1200, 'Ingestion chunk size, characters'),
  num('chunk_overlap', 150, ''),
  // guardrails
  num('max_message_length', 1000, ''),
  num('max_messages_per_session', 60, ''),
  num('rate_limit_per_minute', 12, 'Messages per visitor per minute'),
  num('history_turns', 6, 'Prior turns sent to the model'),
  num('retain_chat_days', 90, 'Sessions idle longer than this are deleted.'),
  // handoff (Cal.com link arrives later — empty hides the CTA)
  bool('handoff_enabled', false, ''),
  str('cal_com_url', '', 'Cal.com booking link'),
  str('handoff_cta_text', 'Book a conversation', ''),
  // notifications (webhook secret stays in service env)
  bool('discord_enabled', false, 'Requires ORBY_DISCORD_WEBHOOK_URL in the service env.'),
];

async function ensureCollection() {
  if (await exists('/collections/orby')) {
    console.log('= collection orby');
  } else {
    await api('/collections', {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({
        collection: 'orby',
        meta: { singleton: true, icon: 'smart_toy', note: 'Orby chat assistant — all runtime settings. Deleting this collection (plus the Orby role) removes Orby.' },
        schema: {},
        fields: [{ field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } }],
      }),
    });
    console.log('+ collection orby (singleton)');
  }
  for (const field of FIELDS) {
    if (await exists(`/fields/orby/${field.field}`)) continue;
    await api('/fields/orby', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(field) });
    console.log(`+ field orby.${field.field}`);
  }
  // seed the singleton row with defaults (PATCH creates it for singletons)
  await api('/items/orby', { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({}) }).catch(() => {});
  console.log('= singleton seeded (enabled=false — flip it in Directus when ready)');
}

async function ensurePermission(policy, collection, options = {}) {
  const payload = {
    policy, collection, action: 'read',
    fields: options.fields ?? ['*'],
    permissions: options.permissions ?? null,
    validation: null, presets: null,
  };
  const existing = await api(
    `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=read&fields=id&limit=1`,
  ).catch(() => []);
  if (existing.length) {
    await api(`/permissions/${existing[0].id}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`= orby read ${collection}`);
  } else {
    await api('/permissions', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) });
    console.log(`+ orby read ${collection}`);
  }
}

async function ensureRole() {
  const roles = await api('/roles?fields=id,name&limit=200');
  let role = roles.find((r) => r.name === 'Orby');
  if (!role) {
    role = await api('/roles', {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({ name: 'Orby', icon: 'smart_toy', description: 'Read-only chat-agent access: config + published content. No mutations, no users.' }),
    });
    console.log('+ role Orby');
  } else console.log('= role Orby');

  const policies = await api('/policies?fields=id,name&limit=200');
  let policy = policies.find((p) => p.name === 'Orby');
  if (!policy) {
    policy = await api('/policies', {
      method: 'POST', headers: jsonHeaders,
      body: JSON.stringify({ name: 'Orby', icon: 'smart_toy', description: 'Orby read-only policy', admin_access: false, app_access: false }),
    });
    console.log('+ policy Orby');
  } else console.log('= policy Orby');

  const access = await api(`/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&fields=id&limit=1`).catch(() => []);
  if (!access.length) {
    await api('/access', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ role: role.id, policy: policy.id }) });
    console.log('+ access Orby role ↔ policy');
  }

  const PUBLISHED = { status: { _eq: 'published' } };
  await ensurePermission(policy.id, 'orby');
  await ensurePermission(policy.id, 'posts', { permissions: PUBLISHED });
  await ensurePermission(policy.id, 'projects', { permissions: PUBLISHED });
  await ensurePermission(policy.id, 'guides', { permissions: PUBLISHED });
  await ensurePermission(policy.id, 'guide_sections', { permissions: { guide: PUBLISHED } });
  // Field-level exclusion of gated content: even a code regression in the ingester
  // cannot read item bodies/urls/curator notes with this token.
  await ensurePermission(policy.id, 'guide_items', {
    permissions: { section: { guide: PUBLISHED } },
    fields: ['id', 'title', 'description', 'section', 'sort', 'type'],
  });
  await ensurePermission(policy.id, 'authors', {
    permissions: PUBLISHED,
    fields: ['id', 'slug', 'display_name', 'role_title', 'bio', 'statement', 'tools', 'dream_team', 'specialties'],
  });
  await ensurePermission(policy.id, 'authors_specialties');
  await ensurePermission(policy.id, 'topics');
  await ensurePermission(policy.id, 'specialties');
  await ensurePermission(policy.id, 'posts_topics');

  console.log('\nNext (manual, one time): User Directory → create user "Orby Bot" with role Orby');
  console.log('→ generate a static token on that user → set it as ORBY_DIRECTUS_TOKEN in the Orby service env.');
}

await ensureCollection();
await ensureRole();
console.log('\nOrby Directus setup complete. Orby stays OFF until you flip `enabled` in Content → Orby.');
