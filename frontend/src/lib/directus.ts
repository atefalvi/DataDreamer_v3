import { createDirectus, rest, readItems, readSingleton, authentication } from '@directus/sdk';

// ─── TYPES ─────────────────────────────────────────

export interface DirectusUser {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
}

export interface Project {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    description?: string;
    cover_image?: string;
    tags?: string[];
    published_at?: string;
    status?: string;
    featured?: boolean;
    author?: DirectusUser;
}

export interface Log {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    published_at?: string;
    tag?: string;
    category?: string;
    status?: string;
    log_number?: number;
    series_label?: string;
    author?: DirectusUser;
}

export interface SiteSettings {
    status_text?: string;
    email?: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    footer_cta_heading?: string;
}

export interface HomeSettings {
    hero_tagline_1?: string;
    hero_tagline_2?: string;
    hero_tagline_3?: string;
}

// ─── ABOUT SUB-TYPES ───────────────────────────────

/** A single stat tile (e.g. "5+ YEARS" / "EXPERIENCE") */
export interface StatItem {
    number: string;
    label: string;
}

/** One entry in the career timeline */
export interface ExperienceItem {
    date: string;
    title: string;
    subtitle: string;
    tag: string;
}

/** A single skill within a SkillCategory */
export interface SkillItem {
    name: string;
    suffix?: string;
}

/** A grouped skill card (e.g. "DATA ENGINEERING") */
export interface SkillCategory {
    header: string;
    name: string;
    items: SkillItem[];
}

export interface AboutSettings {
    hero_tagline?: string;
    hero_title?: string;
    hero_description?: string;
    profile_image?: string;
    resume?: string;
    stats?: StatItem[];
    experience?: ExperienceItem[];
    skills?: SkillCategory[];
    companies?: { directus_file_id: string }[];
}

interface CustomSchema {
    projects: Project[];
    logs: Log[];
    site_settings: SiteSettings;
    home_settings: HomeSettings;
    about: AboutSettings;
}

// ─── CONFIGURATION ─────────────────────────────────
//
// ENV VAR REFERENCE (set these in Coolify → Frontend resource):
//
//   DIRECTUS_URL          The URL the Astro SSR server uses to call the Directus API.
//                         Can be an internal/private network URL in Docker environments.
//                         Coolify value: https://api.data-dreamer.net
//
//   PUBLIC_DIRECTUS_URL   The internet-facing URL used to build /assets/ URLs for
//                         cover images, OG images, and avatars that must be reachable
//                         by browsers, social crawlers (Slackbot, WhatsApp, Facebook).
//                         Falls back to DIRECTUS_URL if not set.
//                         Coolify value: https://api.data-dreamer.net (same here since
//                         api.data-dreamer.net is already public).
//
// ⚠️  NOT THE SAME as the backend env var DIRECTUS_PUBLIC_URL, which is a Directus-
//     specific setting that tells the Directus admin panel its own public URL. That
//     var is only relevant to the backend (datadreamer-backend) Coolify resource.
//
// Read from runtime (process.env) first, then build-time (import.meta.env)
const DIRECTUS_URL = process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';

// For Assets, prioritize PUBLIC_ prefix (runtime/build-time), then fallback to main URL.
const PUBLIC_DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL ?? import.meta.env.PUBLIC_DIRECTUS_URL ??
                            process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ??
                            DIRECTUS_URL;

const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL ?? import.meta.env.DIRECTUS_EMAIL;
const DIRECTUS_PASSWORD = process.env.DIRECTUS_PASSWORD ?? import.meta.env.DIRECTUS_PASSWORD;

console.log(`[Directus] Initialized SDK -> ${DIRECTUS_URL}`);
console.log(`[Directus] Initialized Assets -> ${PUBLIC_DIRECTUS_URL}`);

// Debug helper (ONLY if one of them is localhost in production)
if (DIRECTUS_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.warn(`[Directus] WARNING: Using localhost URL in production! Check your environment variables.`);
}

const directus = createDirectus<CustomSchema>(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

/**
 * Initialize the Directus client with authentication if credentials are provided.
 */
export async function ensureAuthenticated() {
    try {
        if (!DIRECTUS_EMAIL || !DIRECTUS_PASSWORD) {
            // No credentials — relying on Directus Public Role for read access.
            return;
        }
        const token = await directus.getToken();
        if (token) return;
        await directus.login(DIRECTUS_EMAIL, DIRECTUS_PASSWORD);
    } catch (error: any) {
        logError('Authentication failed', error);
        throw error;
    }
}

function logError(context: string, error: any) {
    const message = `[${new Date().toISOString()}] ${context}: ${error.message}`;
    console.error(message);
}

export default directus;

/**
 * Build a full asset URL from a Directus file ID.
 */
export function getAssetUrl(fileId: string): string {
    return `${PUBLIC_DIRECTUS_URL}/assets/${fileId}`;
}

// ─── PROJECTS ──────────────────────────────────────

/**
 * Fetch all projects from Directus.
 */
const PROJECT_FIELDS = [
    'id', 'slug', 'title', 'summary', 'description',
    'cover_image', 'tags', 'published_at', 'featured',
    'author.first_name', 'author.last_name', 'author.avatar',
] as const;

export async function fetchProjects(): Promise<Project[]> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('projects', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                fields: PROJECT_FIELDS as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchProjects failed', error);
        return [];
    }
}

/**
 * Fetch featured projects (or newest if none featured).
 */
export async function fetchFeaturedProjects(limit = 3): Promise<Project[]> {
    try {
        await ensureAuthenticated();
        let items = await directus.request(
            readItems('projects', {
                filter: {
                    _and: [
                        { featured: { _eq: true } },
                        { status: { _eq: 'published' } }
                    ]
                },
                sort: ['-published_at'],
                limit,
                fields: PROJECT_FIELDS as any,
            })
        );
        // Fallback to newest if no featured
        if (!items || items.length === 0) {
            items = await directus.request(
                readItems('projects', {
                    filter: { status: { _eq: 'published' } },
                    sort: ['-published_at'],
                    limit,
                    fields: PROJECT_FIELDS as any,
                })
            );
        }
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchFeaturedProjects failed', error);
        return [];
    }
}

// ─── LOGS ──────────────────────────────────────────

/**
 * Fetch all logs from Directus.
 */
const LOG_FIELDS = [
    'id', 'slug', 'title', 'excerpt', 'content',
    'published_at', 'tag', 'category', 'log_number', 'series_label',
    'author.first_name', 'author.last_name', 'author.avatar',
] as const;

export async function fetchLogs(): Promise<Log[]> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                fields: LOG_FIELDS as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchLogs failed', error);
        return [];
    }
}

/**
 * Fetch recent logs with a limit.
 */
export async function fetchRecentLogs(limit = 3): Promise<Log[]> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { status: { _eq: 'published' } },
                sort: ['-published_at'],
                limit,
                fields: LOG_FIELDS as any,
            })
        );
        return (items as any[]) ?? [];
    } catch (error: any) {
        logError('fetchRecentLogs failed', error);
        return [];
    }
}

/**
 * Fetch a single log by slug from Directus.
 */
export async function fetchLog(slug: string): Promise<Log | null> {
    try {
        await ensureAuthenticated();
        const items = await directus.request(
            readItems('logs', {
                filter: { slug: { _eq: slug } },
                limit: 1,
                fields: LOG_FIELDS as any,
            })
        );
        return (items?.[0] as unknown as Log) ?? null;
    } catch (error: any) {
        logError(`fetchLog(${slug}) failed`, error);
        return null;
    }
}

// ─── SINGLETONS ────────────────────────────────────

/**
 * Fetch site_settings singleton.
 */
export async function fetchSiteSettings(): Promise<SiteSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('site_settings', {
            fields: ['email', 'github', 'linkedin', 'twitter', 'footer_cta_heading', 'status_text'] as any,
        }));
        return data ?? null;
    } catch (error: any) {
        logError('fetchSiteSettings failed', error);
        return null;
    }
}

/**
 * Fetch home_settings singleton.
 */
export async function fetchHomeSettings(): Promise<HomeSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('home_settings', {
            fields: ['hero_tagline_1', 'hero_tagline_2', 'hero_tagline_3'] as any,
        }));
        return data ?? null;
    } catch (error: any) {
        logError('fetchHomeSettings failed', error);
        return null;
    }
}

/**
 * Fetch about singleton.
 */
export async function fetchAbout(): Promise<AboutSettings | null> {
    try {
        await ensureAuthenticated();
        const data = await directus.request(readSingleton('about', {
            fields: ['*', 'companies.directus_file_id' as any]
        }));
        return data ?? null;
    } catch (error: any) {
        logError('fetchAbout failed', error);
        return null;
    }
}
