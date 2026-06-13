/**
 * Zod schemas for Directus JSON fields (09 §1, §4.2). External data is validated at
 * the repository boundary; malformed JSON degrades to a safe default rather than
 * throwing, so one bad author row never blanks a page.
 */
import { z } from 'zod';

export const authorLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

export const authorLinksSchema = z.array(authorLinkSchema).catch([]);

export const toolsSchema = z.array(z.string().min(1)).catch([]);

export const featuredWorkItemSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
  description: z.string().optional(),
});

export const featuredWorkSchema = z.array(featuredWorkItemSchema).max(2).catch([]);

export type AuthorLink = z.infer<typeof authorLinkSchema>;
export type FeaturedWorkItem = z.infer<typeof featuredWorkItemSchema>;
