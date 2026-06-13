import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://data-dreamer.net',
  output: 'server',
  // /about retired (V4: info lives on author pages) — 301 to the team.
  redirects: {
    '/about': '/dream-team',
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    sitemap(),
  ],
});
