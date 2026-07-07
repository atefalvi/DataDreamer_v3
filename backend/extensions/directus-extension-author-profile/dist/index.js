/**
 * Hook: keep each login account linked to an editable author profile.
 *
 * - New users get a draft `authors` profile immediately, so admins can find them in
 *   Content → Authors and review the profile before approval.
 * - When an admin gives the account the Contributor role, the linked profile is
 *   promoted to published. dream_team stays false until separately approved.
 * - Idempotent: if a profile is already linked to the user, it is reused.
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

  async function ensureProfile(userId, status) {
    const linked = await database("authors").where({ user: userId }).first("id");
    if (linked) {
      if (status === "published") {
        await database("authors").where({ id: linked.id }).update({ status: "published" });
        console.info("[author-profile] approved linked profile");
      }
      console.info("[author-profile] profile already linked, skipping");
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
      status,
      dream_team: false,
    });
    console.info("[author-profile] created profile", { slug, status });
  }

  async function onRoleChange(payload, ids) {
    if (!payload?.role) return; // role untouched in this write
    const roleId = await contributorRoleId();
    if (!roleId || payload.role !== roleId) return;
    for (const id of ids) {
      await ensureProfile(id, "published").catch((error) =>
        console.error("[author-profile] failed:", error.message),
      );
    }
  }

  action("users.create", async ({ key }) => {
    await ensureProfile(key, "draft").catch((error) =>
      console.error("[author-profile] failed:", error.message),
    );
  });
  action("users.update", async ({ payload, keys }) => onRoleChange(payload, keys));
};
