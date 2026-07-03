export function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function withGooglePictureUrl(payload, meta) {
  if (meta?.provider !== 'google') return payload;

  const picture = safeHttpsUrl(meta?.providerPayload?.userInfo?.picture);
  if (!picture) return payload;

  return {
    ...payload,
    google_picture_url: picture,
  };
}

export default ({ filter }) => {
  filter('auth.create', withGooglePictureUrl);
  filter('auth.update', withGooglePictureUrl);
};
