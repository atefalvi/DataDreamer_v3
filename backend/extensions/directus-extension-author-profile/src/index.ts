/**
 * Hook: when an admin gives a user the Contributor role, auto-create their linked
 * `authors` profile (display name + slug prefilled from the account) so becoming an
 * author is a single action in User Directory. dream_team starts false — flipping it
 * on the profile is the separate Dream Team approval. Idempotent: if a profile is
 * already linked to the user, nothing happens.
 *
 * dist/index.js is the committed prebuilt output (this file is the source of truth).
 */
import type { HookConfig } from '@directus/extensions';

export function slugify(value: unknown): string {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'author'
  );
}

const hook: HookConfig = ({ action }, { services, database, getSchema }) => {
  console.info('[author-profile] hook loaded');
  const { ItemsService } = services;

  async function contributorRoleId(): Promise<string | undefined> {
    const role = await database('directus_roles').where({ name: 'Contributor' }).first('id');
    return role?.id;
  }

  async function ensureProfile(userId: string): Promise<void> {
    const linked = await database('authors').where({ user: userId }).first('id');
    if (linked) {
      console.info('[author-profile] profile already linked, skipping');
      return;
    }

    const user = await database('directus_users')
      .where({ id: userId })
      .first('first_name', 'last_name', 'email');
    const displayName =
      [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
      (user?.email ?? 'author').split('@')[0];

    let slug = slugify(displayName);
    if (await database('authors').where({ slug }).first('id')) {
      slug = `${slug}-${String(userId).slice(0, 8)}`;
    }

    const authors = new ItemsService('authors', { schema: await getSchema(), knex: database });
    await authors.createOne({
      user: userId,
      display_name: displayName,
      slug,
      role_title: 'Contributor',
      status: 'published', // byline works immediately; dream_team=false keeps them off /dream-team
      dream_team: false,
    });
    console.info('[author-profile] created profile', { slug });
  }

  async function onRoleChange(payload: { role?: string } | undefined, ids: string[]): Promise<void> {
    if (!payload?.role) return; // role untouched in this write
    const roleId = await contributorRoleId();
    if (!roleId || payload.role !== roleId) return;
    for (const id of ids) {
      await ensureProfile(id).catch((error: Error) =>
        console.error('[author-profile] failed:', error.message),
      );
    }
  }

  action('users.create', async ({ payload, key }) => onRoleChange(payload, [key]));
  action('users.update', async ({ payload, keys }) => onRoleChange(payload, keys));
};

export default hook;
