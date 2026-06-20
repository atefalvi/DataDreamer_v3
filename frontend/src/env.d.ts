/// <reference path="../.astro/types.d.ts" />

/** Authenticated guide reader (v4.1). Populated by middleware from the session cookie. */
interface GuideReaderUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  /** Directus access token for this request — used to build a user-scoped client. */
  accessToken: string;
}

declare namespace App {
  interface Locals {
    /** Present only when a valid learner session is attached to the request. */
    user?: GuideReaderUser;
  }
}
