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
  /** Directus access token used only to resolve/verify this learner session. */
  accessToken: string;
}

declare namespace App {
  interface Locals {
    /** Present only when a valid learner session is attached to the request. */
    user?: GuideReaderUser;
  }
}
