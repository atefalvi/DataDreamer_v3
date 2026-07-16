import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import { shouldIncludeStaticSitemapPage } from './src/lib/seo/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://data-dreamer.net',
  output: 'server',
  // Coolify terminates HTTPS before forwarding to the Astro container. Auth/API
  // origin validation is enforced in middleware against SITE_URL instead.
  security: {
    checkOrigin: false,
  },
  // /about retired (V4: info lives on author pages) — 301 to the team.
  redirects: {
    '/about': '/dream-team',
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    sitemap({
      customSitemaps: [
        'https://data-dreamer.net/sitemap-posts.xml',
        'https://data-dreamer.net/sitemap-content.xml',
      ],
      serialize: (item) => ({
        ...item,
        url: item.url === 'https://data-dreamer.net/'
          ? 'https://data-dreamer.net'
          : item.url.replace(/\/$/, ''),
      }),
      filter: shouldIncludeStaticSitemapPage,
    }),
  ],
});
