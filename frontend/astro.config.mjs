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
    sitemap({
      customSitemaps: ['https://data-dreamer.net/sitemap-posts.xml'],
      serialize: (item) => ({
        ...item,
        url: item.url === 'https://data-dreamer.net/'
          ? 'https://data-dreamer.net'
          : item.url.replace(/\/$/, ''),
      }),
      filter: (page) => {
        const { pathname } = new URL(page);
        if (pathname.startsWith('/dev/')) return false;
        if (pathname.startsWith('/logs')) return false;
        if (pathname.startsWith('/api/')) return false;
        if (pathname === '/rss.xml') return false;
        if (pathname.includes('[') || pathname.includes(']')) return false;
        return true;
      },
    }),
  ],
});
