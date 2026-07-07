const DIRECTUS_ASSET_PATH = "/assets/";

export function transformMarkdownImageUrl(src: string, width = 1440): string {
  try {
    const url = new URL(src);
    if (!url.pathname.includes(DIRECTUS_ASSET_PATH)) return src;
    // Idempotent: a URL sized by an earlier pass keeps its width — rehypeImageFigures
    // runs after the image-grid handler and must not clobber 640px thumbs back to 1440.
    if (url.searchParams.has("width")) return src;

    url.searchParams.set("width", String(width));
    url.searchParams.set("format", "webp");
    url.searchParams.set("quality", "82");
    return url.toString();
  } catch {
    return src;
  }
}
