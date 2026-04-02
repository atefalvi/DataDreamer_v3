import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://data-dreamer.net',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    sitemap(),
  ],
});
