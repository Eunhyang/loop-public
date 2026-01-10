/**
 * Merge Performance Data Use Case
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Orchestrates merging of YouTube API data with IndexedDB snapshot data.
 * Uses repository interface for data access (dependency inversion).
 */

import type { ContentPerformance } from '@/types/performance';
import type { ISnapshotRepository } from '../ports/ISnapshotRepository';
import type {
  MergedPerformance,
  MergeResult,
  MergeInput,
  SnapshotMatchResult,
} from '@/lib/domain/performance/types';
import {
  findBestSnapshotMatch,
  mergeMetrics,
  calculateMatchStats,
  buildSnapshotLookup,
  buildDeltaLookup,
  normalizeTitle,
} from '@/lib/domain/performance/merge-logic';

/**
 * Use case for merging API and snapshot performance data
 */
export class MergePerformanceDataUseCase {
  constructor(private readonly snapshotRepo: ISnapshotRepository) {}

  /**
   * Execute the merge operation
   *
   * @param input - API videos and merge options
   * @returns Merged data with statistics
   */
  async execute(input: MergeInput): Promise<MergeResult> {
    const { apiVideos, includeDeltas } = input;

    // Early return if no API data
    if (apiVideos.length === 0) {
      return {
        mergedData: [],
        snapshotDate: null,
        matchStats: { total: 0, exactMatches: 0, fuzzyMatches: 0, noMatches: 0 },
        deltaAvailable: false,
      };
    }

    // Get latest snapshot
    const latestSnapshot = await this.snapshotRepo.getLatestSnapshot();

    if (!latestSnapshot) {
      // No snapshot data - return API data with default displayMetrics
      return this.createResultWithoutSnapshot(apiVideos);
    }

    // Build snapshot lookup map
    const snapshotLookup = buildSnapshotLookup(latestSnapshot.data);
    const snapshotTitles = latestSnapshot.data.map((row) => row.title);

    // Get deltas if requested
    let deltaLookup = new Map();
    let deltaAvailable = false;

    if (includeDeltas) {
      const previousDate = this.snapshotRepo.getPreviousDate(
        latestSnapshot.snapshotDate
      );
      const previousSnapshot = await this.snapshotRepo.getSnapshot(previousDate);

      if (previousSnapshot) {
        const deltas = this.snapshotRepo.calculateDeltas(
          latestSnapshot,
          previousSnapshot
        );
        deltaLookup = buildDeltaLookup(deltas);
        deltaAvailable = true;
      }
    }

    // Merge each API video with snapshot data
    const matches: SnapshotMatchResult[] = [];
    const mergedData: MergedPerformance[] = apiVideos.map((apiVideo) => {
      // Find matching snapshot row
      const matchResult = findBestSnapshotMatch(apiVideo.title, snapshotTitles);
      matches.push(matchResult);

      // Get snapshot data if matched
      const snapshotRow =
        matchResult.matchType !== 'none'
          ? snapshotLookup.get(normalizeTitle(matchResult.snapshotTitle)) ?? null
          : null;

      // Get delta if available
      const snapshotDelta =
        matchResult.matchType !== 'none' && deltaAvailable
          ? deltaLookup.get(normalizeTitle(matchResult.snapshotTitle)) ?? null
          : null;

      // Merge metrics
      const displayMetrics = mergeMetrics(
        apiVideo.metrics,
        snapshotRow,
        snapshotDelta
      );

      return {
        ...apiVideo,
        displayMetrics,
        snapshotMatch: matchResult.matchType !== 'none' ? matchResult : null,
      };
    });

    return {
      mergedData,
      snapshotDate: latestSnapshot.snapshotDate,
      matchStats: calculateMatchStats(matches),
      deltaAvailable,
    };
  }

  /**
   * Create result when no snapshot data available
   */
  private createResultWithoutSnapshot(
    apiVideos: ContentPerformance[]
  ): MergeResult {
    const mergedData: MergedPerformance[] = apiVideos.map((video) => ({
      ...video,
      displayMetrics: {
        ...video.metrics,
        impressionsSource: 'api' as const,
        ctrSource: 'api' as const,
      },
      snapshotMatch: null,
    }));

    return {
      mergedData,
      snapshotDate: null,
      matchStats: {
        total: apiVideos.length,
        exactMatches: 0,
        fuzzyMatches: 0,
        noMatches: apiVideos.length,
      },
      deltaAvailable: false,
    };
  }
}
