#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://data-dreamer.net';
const DEFAULT_API_URL = 'https://api.data-dreamer.net';

const baseUrl = normalizeOrigin(process.argv[2] || process.env.SITE_URL || DEFAULT_BASE_URL);
const apiUrl = normalizeOrigin(process.env.PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || DEFAULT_API_URL);
const slackbot = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';

const checks = [
  ...['/', '/blog', '/projects', '/dream-team', '/connect', '/privacy'].map((path) => ({
    name: `status ${path}`,
    run: () => expectStatus(path, 200),
  })),
  {
    name: '404 status',
    run: () => expectStatus('/not-a-real-v4-release-route', 404),
  },
  {
    name: '/logs redirect',
    run: () => expectRedirect('/logs', '/blog'),
  },
  {
    name: '/logs/:slug redirect',
    run: () => expectRedirect('/logs/retry-patterns', '/blog/retry-patterns'),
  },
  {
    name: 'RSS feed',
    run: async () => {
      const response = await fetchUrl('/rss.xml');
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(
        (response.headers.get('content-type') || '').includes('xml'),
        'expected XML content type',
      );
      const body = await response.text();
      assert(body.includes('<rss') || body.includes('<feed'), 'expected RSS/Atom XML body');
    },
  },
  {
    name: 'sitemap index',
    run: async () => {
      const response = await fetchUrl('/sitemap-index.xml');
      assert(response.status === 200, `expected 200, received ${response.status}`);
      const body = await response.text();
      assert(body.includes('<sitemapindex'), 'expected sitemap index XML');
      assert(body.includes('/sitemap-0.xml'), 'expected static sitemap reference');
      assert(body.includes('/sitemap-posts.xml'), 'expected Writing sitemap reference');
      assert(body.includes('/sitemap-content.xml'), 'expected dynamic content sitemap reference');
    },
  },
  {
    name: 'static sitemap exclusions',
    run: async () => {
      const response = await fetchUrl('/sitemap-0.xml');
      assert(response.status === 200, `expected 200, received ${response.status}`);
      const body = await response.text();
      for (const path of ['/account', '/login', '/signup', '/api/', '/dev/']) {
        assert(!body.includes(`<loc>${baseUrl}${path}`), `static sitemap must exclude ${path}`);
      }
    },
  },
  {
    name: 'dynamic content sitemap',
    run: async () => {
      const response = await fetchUrl('/sitemap-content.xml');
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert((response.headers.get('content-type') || '').includes('xml'), 'expected XML content type');
      assert((await response.text()).includes('<urlset'), 'expected sitemap URL set');
    },
  },
  {
    name: 'robots',
    run: async () => {
      const response = await fetchUrl('/robots.txt');
      assert(response.status === 200, `expected 200, received ${response.status}`);
      const body = await response.text();
      assert(body.includes('Sitemap:'), 'expected Sitemap directive');
    },
  },
  {
    name: 'OG fetch as Slackbot',
    run: async () => {
      const response = await fetchUrl('/og/og-home.png', {
        headers: { 'user-agent': slackbot },
      });
      assert(response.status === 200, `expected 200, received ${response.status}`);
      assert(
        (response.headers.get('content-type') || '').includes('image/png'),
        'expected PNG content type',
      );
    },
  },
  {
    name: 'frontend security headers',
    run: async () => {
      const response = await fetchUrl('/');
      assertHeader(response, 'content-security-policy');
      assertHeader(response, 'x-content-type-options', 'nosniff');
      assertHeader(response, 'referrer-policy', 'strict-origin-when-cross-origin');
      assertHeader(response, 'permissions-policy');
      assert(
        !response.headers.has('content-security-policy-report-only'),
        'expected enforcing CSP, not report-only',
      );
    },
  },
  {
    name: 'Directus health',
    run: async () => {
      const response = await fetchAbsolute(`${apiUrl}/server/health`);
      assert(
        [200, 204, 401, 403].includes(response.status),
        `expected reachable Directus health endpoint, received ${response.status}`,
      );
    },
  },
];

const started = Date.now();
const results = [];

for (const check of checks) {
  try {
    await check.run();
    results.push({ name: check.name, ok: true });
    console.log(`PASS ${check.name}`);
  } catch (error) {
    results.push({ name: check.name, ok: false, error: error.message });
    console.error(`FAIL ${check.name}: ${error.message}`);
  }
}

const failures = results.filter((result) => !result.ok);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

console.log('');
console.log(`Release smoke target: ${baseUrl}`);
console.log(`Directus target: ${apiUrl}`);
console.log(`Checks: ${results.length - failures.length}/${results.length} passed in ${seconds}s`);

if (failures.length) {
  process.exitCode = 1;
}

async function expectStatus(path, status) {
  const response = await fetchUrl(path);
  assert(response.status === status, `expected ${status}, received ${response.status}`);
}

async function expectRedirect(path, expectedLocationPath) {
  const response = await fetchUrl(path, { redirect: 'manual' });
  assert([301, 308].includes(response.status), `expected 301/308, received ${response.status}`);
  const location = response.headers.get('location');
  assert(location, 'missing Location header');
  const redirected = new URL(location, baseUrl);
  assert(
    redirected.pathname === expectedLocationPath,
    `expected redirect to ${expectedLocationPath}, received ${redirected.pathname}`,
  );
}

async function fetchUrl(path, options = {}) {
  return fetchAbsolute(new URL(path, baseUrl).toString(), options);
}

async function fetchAbsolute(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'user-agent': 'DataDreamer release smoke/4.0',
      ...(options.headers || {}),
    },
  });
}

function assertHeader(response, name, expectedValue) {
  const value = response.headers.get(name);
  assert(value, `missing ${name}`);
  if (expectedValue) {
    assert(value === expectedValue, `expected ${name}: ${expectedValue}, received ${value}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }
}
