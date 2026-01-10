/**
 * IndexedDB Snapshot Repository
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Implements ISnapshotRepository interface using existing snapshot-storage functions.
 * Adapts existing infrastructure to clean architecture pattern.
 */

import type { ISnapshotRepository } from '@/lib/application/performance/ports/ISnapshotRepository';
import type { YouTubeSnapshot, SnapshotDelta } from '@/types/youtube-snapshot';
import {
  getLatestSnapshot,
  getSnapshot,
} from '@/lib/youtube/snapshot-storage';
import {
  calculateDeltas,
  getPreviousDate,
} from '@/lib/youtube/snapshot-calculator';

/**
 * IndexedDB implementation of ISnapshotRepository
 */
export class IndexedDBSnapshotRepository implements ISnapshotRepository {
  /**
   * Get the most recent snapshot from IndexedDB
   */
  async getLatestSnapshot(): Promise<YouTubeSnapshot | null> {
    return getLatestSnapshot();
  }

  /**
   * Get snapshot by date from IndexedDB
   * @param date - ISO date string (YYYY-MM-DD)
   */
  async getSnapshot(date: string): Promise<YouTubeSnapshot | null> {
    return getSnapshot(date);
  }

  /**
   * Calculate 24h deltas between two snapshots
   * Delegates to snapshot-calculator.ts
   */
  calculateDeltas(
    today: YouTubeSnapshot,
    yesterday: YouTubeSnapshot
  ): SnapshotDelta[] {
    return calculateDeltas(today, yesterday);
  }

  /**
   * Get the previous date string
   * Delegates to snapshot-calculator.ts
   */
  getPreviousDate(date: string): string {
    return getPreviousDate(date);
  }
}

/**
 * Factory function for creating repository instance
 */
export function createIndexedDBSnapshotRepository(): ISnapshotRepository {
  return new IndexedDBSnapshotRepository();
}
