import type { AuthorRef } from '../../types/content';

const AUTHOR_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function hasValidAuthorSlug(author: Pick<AuthorRef, 'slug'> | undefined): boolean {
  return Boolean(author?.slug && author.slug !== 'unknown' && AUTHOR_SLUG.test(author.slug));
}

/** The public profile exists only for an approved Dream Team author with a valid slug. */
export function publicAuthorProfilePath(author: AuthorRef | undefined): string | undefined {
  return author?.dreamTeam && hasValidAuthorSlug(author)
    ? `/dream-team/${author.slug}`
    : undefined;
}

/** A safe fallback for bylines when the author has no public Dream Team profile. */
export function writingAuthorPath(author: AuthorRef | undefined): string | undefined {
  return hasValidAuthorSlug(author)
    ? `/blog?author=${encodeURIComponent(author!.slug)}`
    : undefined;
}
