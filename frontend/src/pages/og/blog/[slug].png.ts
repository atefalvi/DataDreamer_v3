/**
 * /og/blog/<slug>.png — dynamic OG card for a published post: brand background,
 * title, author avatar + name, main topic chip. Edge-cached; 404 for unknown slugs.
 */
import type { APIRoute } from 'astro';
import { postsRepo } from '../../../lib/repositories';
import { avatarDataUri, renderOgCard } from '../../../lib/og/render';
import { PUBLIC_DIRECTUS_URL } from '../../../lib/directus/client';

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const post = await postsRepo.cardBySlug(slug).catch(() => null);
  if (!post) return new Response(null, { status: 404 });

  const avatar = post.author.avatar?.id
    ? await avatarDataUri(PUBLIC_DIRECTUS_URL, post.author.avatar.id)
    : undefined;

  const png = await renderOgCard({
    kicker: 'Post',
    title: post.title,
    authorName: post.author.name,
    avatarDataUri: avatar,
    tag: post.topics[0]?.name,
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
