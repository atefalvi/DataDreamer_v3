/// <reference types="vitest" />
// getViteConfig injects Astro's Vite plugins so tests can import and render `.astro`
// components (e.g. the SeoHead container test). Plain `.ts` tests are unaffected.
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    testTimeout: 15000,
  },
});
