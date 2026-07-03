/**
 * Hook: copy the Google OIDC `picture` claim onto directus_users.google_picture_url
 * when a user signs in / is provisioned via Google. Directus persists the returned
 * payload itself — no service token, no stored OAuth tokens, avatar field untouched.
 *
 * dist/index.js is the committed prebuilt output (this file is the source of truth).
 */
import type { HookConfig } from '@directus/extensions';

export function safeHttpsUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

type AuthMeta = {
  provider?: string;
  user?: string;
  userId?: string;
  providerPayload?: { userInfo?: Record<string, unknown> };
};

function diagnostics(event: string, payload: any, meta: AuthMeta | undefined, picture: unknown) {
  const provider = typeof meta?.provider === 'string' ? meta.provider : undefined;
  const userInfo = meta?.providerPayload?.userInfo;
  const picturePresent = typeof picture === 'string' && picture.length > 0;
  const pictureHttpsValid = Boolean(safeHttpsUrl(picture));
  const updateAttempted = provider === 'google' && pictureHttpsValid;

  // Safe only: booleans/keys — never tokens, cookies, raw payloads, or the picture value.
  console.info('[google-picture-url]', {
    event,
    provider,
    userIdPresent: Boolean(payload?.id || meta?.user || meta?.userId),
    userInfoPresent: Boolean(userInfo),
    picturePresent,
    pictureHttpsValid,
    updateAttempted,
    updateStatus: updateAttempted ? 'payload-updated' : 'skipped',
  });

  if (!picturePresent && userInfo && typeof userInfo === 'object') {
    console.info('[google-picture-url] userInfo keys', Object.keys(userInfo));
  }
}

export function withGooglePictureUrl(event: string, payload: any, meta: AuthMeta | undefined) {
  diagnostics(event, payload, meta, meta?.providerPayload?.userInfo?.picture);

  if (meta?.provider !== 'google') return payload;

  const picture = safeHttpsUrl(meta?.providerPayload?.userInfo?.picture);
  if (!picture) return payload;

  return { ...payload, google_picture_url: picture };
}

const hook: HookConfig = ({ filter }) => {
  console.info('[google-picture-url] hook loaded');
  filter('auth.create', (payload, meta) => withGooglePictureUrl('auth.create', payload, meta as AuthMeta));
  filter('auth.update', (payload, meta) => withGooglePictureUrl('auth.update', payload, meta as AuthMeta));
};

export default hook;
