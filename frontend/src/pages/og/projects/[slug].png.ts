/**
 * /og/projects/<slug>.png — dynamic OG card for a published project: brand
 * background, title, author avatar + name, and primary tag. Replaces the pre-generated
 * per-project PNG templates. Edge-cached; 404 for unknown slugs.
 */
import type { APIRoute } from 'astro';
import { projectsRepo } from '../../../lib/repositories';
import { avatarDataUri, coverDataUri, renderOgCard } from '../../../lib/og/render';
import { PUBLIC_DIRECTUS_URL } from '../../../lib/directus/client';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const project = await projectsRepo.cardBySlug(slug).catch(() => null);
  if (!project) return new Response(null, { status: 404 });

  const [avatar, cover] = await Promise.all([
    project.author.avatar?.id
      ? avatarDataUri(PUBLIC_DIRECTUS_URL, project.author.avatar.id)
      : undefined,
    project.coverImage?.id
      ? coverDataUri(PUBLIC_DIRECTUS_URL, project.coverImage.id)
      : undefined,
  ]);

  const png = await renderOgCard({
    kicker: `Project · ${project.year}`,
    title: project.title,
    authorName: project.author.name,
    avatarDataUri: avatar,
    coverDataUri: cover,
    tag: project.tags[0],
    seed: slug,
  });

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
};
