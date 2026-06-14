/**
 * Astro content collections (09 §5). `projects` is the only repo-owned collection — long-
 * form case studies authored in markdown with git review (03 §3 boundary; the Directus
 * `projects` collection is archived by V4-CMS-005). Uses the Astro 5 content-layer glob
 * loader so `src/content/site.ts` stays a plain config module.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      summary: z.string().max(220),
      year: z.number().int(),
      role: z.string(),
      author: z.object({
        name: z.string(),
        role: z.string().optional(),
        href: z.string().optional(),
      }),
      stack: z.array(z.string()).max(10),
      cover: image(),
      coverAlt: z.string(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      links: z
        .array(z.object({ label: z.string(), url: z.string().url() }))
        .optional(),
    }),
});

export const collections = { projects };
