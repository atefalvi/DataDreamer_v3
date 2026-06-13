/**
 * Directus client (v4) — REST only, no interactive auth/login path.
 *
 * v4.0 public reads use the Directus Public role. Where the Public role is not open
 * (e.g. the greenfield staging instance), set a read-only `DIRECTUS_TOKEN` and the
 * client attaches it as a static token. This replaces the v3 admin email/password
 * login (audit 02 §4, 08 §5). Server writes in v4.1 will use a separate
 * `DIRECTUS_SERVICE_TOKEN` — never this read token, never a `PUBLIC_` var.
 */
import { createDirectus, rest, staticToken } from '@directus/sdk';
import type { Schema } from './schema';

function env(name: string): string | undefined {
  return process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name];
}

export const DIRECTUS_URL = env('DIRECTUS_URL') ?? 'http://localhost:8055';
export const PUBLIC_DIRECTUS_URL =
  env('PUBLIC_DIRECTUS_URL') ?? env('DIRECTUS_URL') ?? DIRECTUS_URL;

const READ_TOKEN = env('DIRECTUS_TOKEN');

function build() {
  const base = createDirectus<Schema>(DIRECTUS_URL).with(rest());
  return READ_TOKEN ? base.with(staticToken(READ_TOKEN)) : base;
}

export const directus = build();
