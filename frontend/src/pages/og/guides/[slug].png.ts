/**
 * /og/guides/<slug>.png — dynamic OG card for a published guide. The shared
 * renderer keeps Guides visually aligned with Posts and Projects while the
 * difficulty and primary topic identify the learning path at a glance.
 */
import type { APIRoute } from 'astro';
import { guidesRepo } from '../../../lib/repositories';
import { avatarDataUri, coverDataUri, renderOgCard } from '../../../lib/og/render';
import { PUBLIC_DIRECTUS_URL } from '../../../lib/directus/client';

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const guide = await guidesRepo.previewBySlug(slug).catch(() => null);
  if (!guide) return new Response(null, { status: 404 });

  const [avatar, cover] = await Promise.all([
    guide.curator.avatar?.id
      ? avatarDataUri(PUBLIC_DIRECTUS_URL, guide.curator.avatar.id)
      : undefined,
    guide.coverImage?.id
      ? coverDataUri(PUBLIC_DIRECTUS_URL, guide.coverImage.id)
      : undefined,
  ]);

  const png = await renderOgCard({
    kicker: `Guide · ${titleCase(guide.difficulty)}`,
    title: guide.title,
    authorName: guide.curator.name,
    avatarDataUri: avatar,
    coverDataUri: cover,
    tag: guide.topics[0]?.name,
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
