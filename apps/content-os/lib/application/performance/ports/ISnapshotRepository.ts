/**
 * Snapshot Repository Port (Interface)
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Defines the contract for snapshot data access.
 * Infrastructure layer implements this interface.
 */

import type { YouTubeSnapshot, SnapshotDelta } from '@/types/youtube-snapshot';

/**
 * Repository interface for snapshot operations
 */
export interface ISnapshotRepository {
  /**
   * Get the most recent snapshot
   */
  getLatestSnapshot(): Promise<YouTubeSnapshot | null>;

  /**
   * Get snapshot by date
   * @param date - ISO date string (YYYY-MM-DD)
   */
  getSnapshot(date: string): Promise<YouTubeSnapshot | null>;

  /**
   * Calculate 24h deltas between two snapshots
   * @param today - Today's snapshot
   * @param yesterday - Yesterday's snapshot
   */
  calculateDeltas(
    today: YouTubeSnapshot,
    yesterday: YouTubeSnapshot
  ): SnapshotDelta[];

  /**
   * Get the previous date string
   * @param date - Current date (YYYY-MM-DD)
   * @returns Previous date (YYYY-MM-DD)
   */
  getPreviousDate(date: string): string;
}
