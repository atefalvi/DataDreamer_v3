export function safeHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function diagnostics(event, payload, meta, picture) {
  const provider = typeof meta?.provider === 'string' ? meta.provider : undefined;
  const userInfo = meta?.providerPayload?.userInfo;
  const picturePresent = typeof picture === 'string' && picture.length > 0;
  const pictureHttpsValid = Boolean(safeHttpsUrl(picture));
  const updateAttempted = provider === 'google' && pictureHttpsValid;

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

export function withGooglePictureUrl(event, payload, meta) {
  diagnostics(event, payload, meta, meta?.providerPayload?.userInfo?.picture);

  if (meta?.provider !== 'google') return payload;

  const picture = safeHttpsUrl(meta?.providerPayload?.userInfo?.picture);
  if (!picture) return payload;

  return {
    ...payload,
    google_picture_url: picture,
  };
}

export default ({ filter }) => {
  console.info('[google-picture-url] hook loaded');
  filter('auth.create', (payload, meta) => withGooglePictureUrl('auth.create', payload, meta));
  filter('auth.update', (payload, meta) => withGooglePictureUrl('auth.update', payload, meta));
};
