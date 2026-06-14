/**
 * Repository layer entry point (09 §4). Pages and components import from here —
 * never `@directus/sdk` directly (grep gate 09 §4.1).
 *
 *   import { postsRepo, authorsRepo, topicsRepo } from '../lib/repositories';
 */
export * as postsRepo from './posts';
export * as authorsRepo from './authors';
export * as topicsRepo from './topics';
export * as projectsRepo from './projects';

export { RepositoryError } from './errors';
export type { RepositoryErrorKind } from './errors';
export { cachedPerRequest } from './cache';
