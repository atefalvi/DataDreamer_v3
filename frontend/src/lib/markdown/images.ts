const DIRECTUS_ASSET_PATH = "/assets/";

export function transformMarkdownImageUrl(src: string): string {
  try {
    const url = new URL(src);
    if (!url.pathname.includes(DIRECTUS_ASSET_PATH)) return src;

    url.searchParams.set("width", "1440");
    url.searchParams.set("format", "webp");
    url.searchParams.set("quality", "82");
    return url.toString();
  } catch {
    return src;
  }
}
