# Cloudflare anonymous HTML cache

The Astro origin already sends anonymous successful HTML as:

```http
Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400
```

Requests carrying a Data Dreamer session cookie are changed by middleware to
`private, no-store`. Cloudflare does not cache HTML solely because `s-maxage` is
present, so production also needs Cache Rules that make anonymous HTML eligible while
always bypassing personalized responses.

## Dashboard configuration

In the Cloudflare zone for `data-dreamer.net`, open **Rules → Cache Rules** and create
these rules in this order.

### 1. Bypass authenticated sessions

Expression:

```text
(http.host eq "data-dreamer.net" and
 (http.cookie contains "dd_at=" or
  http.cookie contains "dd_rt=" or
  http.cookie contains "directus_session_token="))
```

Cache eligibility: **Bypass cache**.

### 2. Cache anonymous public pages

Expression:

```text
(http.host eq "data-dreamer.net" and
 http.request.method in {"GET" "HEAD"} and
 not starts_with(http.request.uri.path, "/api/") and
 not (http.request.uri.path eq "/account" or starts_with(http.request.uri.path, "/account/")) and
 not (http.request.uri.path eq "/login" or starts_with(http.request.uri.path, "/login/")) and
 not (http.request.uri.path eq "/signup" or starts_with(http.request.uri.path, "/signup/")))
```

Settings:

- Cache eligibility: **Eligible for cache**.
- Edge TTL: **Use cache-control header if present**.
- Browser TTL: **Respect existing headers**.
- Do not add a cache-key rule that ignores cookies.

The bypass rule must remain above the anonymous rule. Guide preview URLs are safe to
cache anonymously because any request carrying an authentication cookie matches the
bypass rule and the origin also returns `private, no-store`.

## Verification

Make two anonymous requests after deployment and rule propagation:

```bash
curl -sSI https://data-dreamer.net/
curl -sSI https://data-dreamer.net/
```

Expected:

- origin `Cache-Control` retains `s-maxage=300`;
- first request is normally `CF-Cache-Status: MISS`;
- a subsequent request becomes `HIT`, `REVALIDATED`, or `STALE`.

Then verify a signed-in browser response in its network inspector:

- `Cache-Control: private, no-store`;
- `CF-Cache-Status: BYPASS` or `DYNAMIC`;
- authenticated navigation and guide progress are never served from shared cache.

If anonymous HTML continues to return `CF-Cache-Status: DYNAMIC`, confirm that the
anonymous rule is enabled, ordered after the bypass rule, and not overridden by a
broader bypass rule or Worker route.
