/// <reference path="../.astro/types.d.ts" />

/** Authenticated guide reader (v4.1). Populated by middleware from the session cookie. */
interface GuideReaderUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  provider?: string;
  avatarId?: string;
  avatarUrl?: string;
  googlePictureUrl?: string;
  /** True when an authors profile is linked to this account (approved contributor). */
  hasAuthorProfile: boolean;
  authorId?: string;
  authorSlug?: string;
  authorDisplayName?: string;
  /** Directus access token used only to resolve/verify this learner session. */
  accessToken: string;
}

declare namespace App {
  interface Locals {
    /** Present only when a valid learner session is attached to the request. */
    user?: GuideReaderUser;
  }
}
