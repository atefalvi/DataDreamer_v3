import { describe, it, expect } from 'vitest';
import {
  deriveProgress,
  pruneCompleted,
  formatMinutes,
  type ProgressItem,
} from '../progress';
import type { StoredGuideProgress } from '../../../types/content';

const ITEMS: ProgressItem[] = [
  { id: 'a', estimatedMinutes: 5 },
  { id: 'b', estimatedMinutes: 20 },
  { id: 'c', estimatedMinutes: 25 },
  { id: 'd' }, // no estimate
];

function stored(partial: Partial<StoredGuideProgress>): StoredGuideProgress {
  return { completedItemIds: [], ...partial };
}

describe('deriveProgress', () => {
  it('reports not-started for anonymous / empty state', () => {
    const p = deriveProgress(ITEMS, null);
    expect(p.status).toBe('not-started');
    expect(p.percent).toBe(0);
    expect(p.completedCount).toBe(0);
    expect(p.remainingCount).toBe(4);
    expect(p.totalCount).toBe(4);
    expect(p.estMinutesRemaining).toBe(50);
    expect(p.resumeItemId).toBe('a'); // first item
  });

  it('computes partial progress, percent, and time remaining', () => {
    const p = deriveProgress(ITEMS, stored({ completedItemIds: ['a', 'b'], lastItemId: 'b' }));
    expect(p.status).toBe('in-progress');
    expect(p.completedCount).toBe(2);
    expect(p.remainingCount).toBe(2);
    expect(p.percent).toBe(50);
    expect(p.estMinutesRemaining).toBe(25); // c(25) + d(0)
    expect(p.resumeItemId).toBe('c'); // lastItem 'b' is complete → first incomplete
  });

  it('resumes at last-touched item when it is still incomplete', () => {
    const p = deriveProgress(ITEMS, stored({ completedItemIds: ['a'], lastItemId: 'c' }));
    expect(p.resumeItemId).toBe('c');
  });

  it('reports completed when every item is done', () => {
    const p = deriveProgress(ITEMS, stored({ completedItemIds: ['a', 'b', 'c', 'd'] }));
    expect(p.status).toBe('completed');
    expect(p.percent).toBe(100);
    expect(p.remainingCount).toBe(0);
    expect(p.estMinutesRemaining).toBe(0);
    expect(p.resumeItemId).toBeUndefined();
  });

  it('prunes completed ids that no longer exist in the guide', () => {
    const p = deriveProgress(ITEMS, stored({ completedItemIds: ['a', 'ghost', 'b'] }));
    expect(p.completedCount).toBe(2);
    expect(p.percent).toBe(50);
  });

  it('handles an empty guide without dividing by zero', () => {
    const p = deriveProgress([], stored({ completedItemIds: ['x'] }));
    expect(p.status).toBe('not-started');
    expect(p.percent).toBe(0);
    expect(p.totalCount).toBe(0);
    expect(p.resumeItemId).toBeUndefined();
  });
});

describe('pruneCompleted', () => {
  it('keeps only live ids, in item order', () => {
    expect(pruneCompleted(ITEMS, ['c', 'a', 'ghost'])).toEqual(['a', 'c']);
  });
});

describe('formatMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatMinutes(135)).toBe('2h 15m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(0)).toBe('0m');
  });
});
