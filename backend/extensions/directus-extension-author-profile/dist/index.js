/**
 * Hook: one-action author approval.
 *
 * When an admin sets a user's role to Contributor (User Directory → Role → Save),
 * ensure that user has exactly one linked `authors` profile:
 *  - none linked  → create one, prefilled from the account (display name, slug),
 *    status published so bylines/account editing work immediately, dream_team=false
 *    (Dream Team stays a separate, admin-only toggle).
 *  - already linked → reuse it untouched; only a `draft` profile is promoted to
 *    published (an `archived` profile stays archived — that was a deliberate admin
 *    choice and approval must not silently revive it).
 *
 * Signups deliberately do NOT create profiles: authors = approved contributors,
 * not every learner. Idempotent; never duplicates; never overwrites profile fields.
 */

export function slugify(value) {
  return (
    String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "author"
  );
}

export default ({ action }, { services, database, getSchema }) => {
  console.info("[author-profile] hook loaded");
  const { ItemsService } = services;

  async function contributorRoleId() {
    const role = await database("directus_roles").where({ name: "Contributor" }).first("id");
    return role?.id;
  }

  async function ensureProfile(userId) {
    const linked = await database("authors").where({ user: userId }).first("id", "status");
    if (linked) {
      if (linked.status === "draft") {
        await database("authors").where({ id: linked.id }).update({ status: "published" });
        console.info("[author-profile] published linked draft profile");
      } else {
        console.info("[author-profile] profile already linked, skipping");
      }
      return;
    }

    const user = await database("directus_users")
      .where({ id: userId })
      .first("first_name", "last_name", "email");
    const displayName =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      (user?.email ?? "author").split("@")[0];

    let slug = slugify(displayName);
    if (await database("authors").where({ slug }).first("id")) {
      slug = `${slug}-${String(userId).slice(0, 8)}`;
    }

    const authors = new ItemsService("authors", { schema: await getSchema(), knex: database });
    await authors.createOne({
      user: userId,
      display_name: displayName,
      slug,
      role_title: "Contributor",
      status: "published",
      dream_team: false,
    });
    console.info("[author-profile] created profile", { slug });
  }

  async function onRoleChange(payload, ids) {
    if (!payload?.role) return; // role untouched in this write
    const roleId = await contributorRoleId();
    if (!roleId || payload.role !== roleId) return;
    for (const id of ids) {
      await ensureProfile(id).catch((error) =>
        console.error("[author-profile] failed:", error.message),
      );
    }
  }

  // Covers both paths: promoting an existing user, and creating a user directly
  // with the Contributor role. Plain signups (guide_reader) create no profile.
  action("users.create", async ({ payload, key }) => onRoleChange(payload, [key]));
  action("users.update", async ({ payload, keys }) => onRoleChange(payload, keys));
};
