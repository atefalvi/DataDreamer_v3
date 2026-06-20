/**
 * Field Guide progress — pure derivation (09 §10, 13 V4-GUIDE-003).
 *
 * The single source of truth for turning a guide's item list + a learner's stored
 * completion state into the display shape (status / percent / counts / time remaining /
 * resume target). Pure and dependency-free so it runs identically on the server (in the
 * `/api/guides/progress` endpoint and during SSR) and in the browser enhancer, and so
 * it is trivially unit-testable.
 */
import type {
  DerivedGuideProgress,
  Guide,
  GuideItem,
  GuideProgressStatus,
  StoredGuideProgress,
} from '../../types/content';

/** Minimal item shape the math needs — keeps `deriveProgress` easy to test. */
export interface ProgressItem {
  id: string;
  estimatedMinutes?: number;
}

/** Flatten a guide's sections into an ordered item list (reading order). */
export function flattenItems(guide: Pick<Guide, 'sections'>): GuideItem[] {
  return guide.sections.flatMap((section) => section.items);
}

/**
 * Keep only completed ids that still exist in the guide, so percent stays honest when a
 * curator removes an item (09 §10). Order follows `items`.
 */
export function pruneCompleted(items: ProgressItem[], completedItemIds: string[]): string[] {
  const completed = new Set(completedItemIds);
  return items.filter((item) => completed.has(item.id)).map((item) => item.id);
}

function statusOf(completedCount: number, totalCount: number): GuideProgressStatus {
  if (completedCount === 0) return 'not-started';
  if (totalCount > 0 && completedCount >= totalCount) return 'completed';
  return 'in-progress';
}

/**
 * Derive the display progress for a guide. `stored` may be null (anonymous / never
 * started). Completed ids are pruned against the live item list first.
 */
export function deriveProgress(
  items: ProgressItem[],
  stored: StoredGuideProgress | null | undefined,
): DerivedGuideProgress {
  const totalCount = items.length;
  const completedIds = new Set(stored ? pruneCompleted(items, stored.completedItemIds) : []);

  const completedCount = completedIds.size;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const incomplete = items.filter((item) => !completedIds.has(item.id));
  const estMinutesRemaining = incomplete.reduce(
    (sum, item) => sum + (item.estimatedMinutes ?? 0),
    0,
  );

  // Resume target: the last item the learner touched if it's still incomplete; else the
  // first incomplete item; undefined once everything is done.
  let resumeItemId: string | undefined;
  if (incomplete.length > 0) {
    const lastStillOpen =
      stored?.lastItemId && incomplete.some((item) => item.id === stored.lastItemId)
        ? stored.lastItemId
        : undefined;
    resumeItemId = lastStillOpen ?? incomplete[0].id;
  }

  return {
    status: statusOf(completedCount, totalCount),
    percent,
    completedCount,
    remainingCount,
    totalCount,
    estMinutesRemaining,
    resumeItemId,
  };
}

/** Convenience: derive directly from a hydrated guide. */
export function deriveGuideProgress(
  guide: Pick<Guide, 'sections'>,
  stored: StoredGuideProgress | null | undefined,
): DerivedGuideProgress {
  return deriveProgress(flattenItems(guide), stored);
}

/** "~2h 15m", "~45m", "Done" — compact human label for time remaining. */
export function formatMinutes(total: number): string {
  if (total <= 0) return '0m';
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}
